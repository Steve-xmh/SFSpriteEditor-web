import { useEffect, useRef, useState } from "preact/hooks"
import { Property } from 'csstype'
import { hitTest, HitTestResult, renderSprite, renderSubSprite, SFSprite, Sprite } from "../utils/sfsprite"
import { FunctionComponent } from "preact"
import { getCurrentTool, getHiddenSubsprites, getId, getPreviewPalette, getSelectedColorIndex, getTextToolText, getViewType, isPreviewTransparent, switchColorIndex, Tools } from "../reducers/editing"
import { useDispatch, useSelector } from "react-redux"
import styles from './editor-canvas.module.css'
import { getSprite, setPixels, setSprite, CLEAR_HISTORY, REDO, UNDO } from "../reducers/sprite"
import { BufferReader } from "../utils/buffer"
import gridImage from "../utils/grid-image"
import { line } from "../utils/line"
import { ActionCreators } from "redux-undo"
import { getCurrentTab } from "../reducers/tab"
import TextCanvas from "../utils/TextCanvas"
import { getOption } from "../reducers/options"
import { MainStore } from "../reducers"

export const EditorCanvas: FunctionComponent = () => {
    const dispatch = useDispatch()
    const [hitTestResult, setHitTestResult] = useState<HitTestResult | null>(null)
    const [canvasCursor, setCanvasCursor] = useState<Property.Cursor>('')
    const currentTab = useSelector(getCurrentTab)
    const viewType = useSelector(getViewType)
    const viewId = useSelector(getId)
    const hiddenSubsprites = useSelector(getHiddenSubsprites)
    const colorIndex = useSelector(getSelectedColorIndex)
    const previewPalette = useSelector(getPreviewPalette)
    const previewTransparent = useSelector(isPreviewTransparent)
    const sprite = useSelector(getSprite)
    const textToolText = useSelector(getTextToolText)
    const showSubspritesBound = useSelector((state: MainStore) => getOption(state, 'showSubSpriteBounds'))
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [canvasView, setCanvasView] = useState({
        x: 0,
        y: 0,
        scale: 10,
    })
    const [previewPixels, setPreviewPixels] = useState(new Set<[number, number]>())

    const usingTool = useSelector(getCurrentTool)
    const canvasRef = useRef<HTMLCanvasElement>()
    function getTarget(mousePosX?: number, mousePosY?: number) {
        if (canvasRef.current) {
            const offsetX = (((canvasRef.current.width - 256) / 2) | 0) + canvasView.x
            const offsetY = (((canvasRef.current.height - 256) / 2) | 0) + canvasView.y

            const targetX = Math.floor((((mousePosX || mousePos.x) - offsetX - 127) / canvasView.scale))
            const targetY = Math.floor((((mousePosY || mousePos.y) - offsetY - 127) / canvasView.scale))
            return { x: targetX, y: targetY }
        }
        return null
    }
    const textCanvas = useRef(new TextCanvas())
    useEffect(() => {
        if (textCanvas.current) {
            textCanvas.current.setText(textToolText)
        }
    }, [textToolText, textCanvas.current])
    interface ToolTemp {
        x: number
        y: number
        originPos: { x: number, y: number }
        movingSubsprite: HitTestResult
    }
    const toolTempRef = useRef<ToolTemp>()
    function onCanvasMouseClick(evt: React.MouseEvent<HTMLCanvasElement>) {
        if (usingTool === Tools.ColorPicker) {
            const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
            if (sprite) {
                switch (viewType) {
                    case 'sprite':
                        if (sprite.sprites[viewId]) {
                            const s = sprite.sprites[viewId]
                            const t = sprite.tilesets[s.tileSetID]
                            const test = hitTest({
                                sprite: s,
                                tileset: t,
                                blacklist: hiddenSubsprites,
                                x: targetPos.x,
                                y: targetPos.y,
                                transparent: !previewTransparent
                            })
                            if (test) {
                                dispatch(switchColorIndex(test.pixelColorIndex))
                            }
                        }
                }
            }
        } else if (usingTool === Tools.Text && textCanvas.current && textCanvas.current.textData) {
            const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
            if (sprite) {
                switch (viewType) {
                    case 'sprite':
                        const s = sprite.sprites[viewId]
                        const t = sprite.tilesets[s.tileSetID]
                        const pixelMap = {}
                        for (let y = 0; y < textCanvas.current.textData.height; y++) {
                            for (let x = 0; x < textCanvas.current.textData.width; x++) {
                                const pixel = textCanvas.current.textData.data[(y * textCanvas.current.textData.width + x) * 4 + 3]
                                if (pixel === 255) {
                                    const test = hitTest({
                                        sprite: s,
                                        tileset: t,
                                        blacklist: hiddenSubsprites,
                                        x: targetPos.x + x,
                                        y: targetPos.y + y,
                                        transparent: !previewTransparent
                                    })
                                    if (test) {
                                        if (pixelMap[test.tileId]) {
                                            pixelMap[test.tileId].push(test.pixelIndex)
                                        } else {
                                            pixelMap[test.tileId] = [test.pixelIndex]
                                        }
                                    }
                                }
                            }
                        }
                        if (Object.keys(pixelMap).length > 0) {
                            dispatch(setPixels(colorIndex, s.tileSetID, pixelMap))
                        }
                        break
                }
            }
        } else if (usingTool === Tools.Fill) {
            const targetPos = getTarget()
            if (sprite) {
                switch (viewType) {
                    case 'sprite':
                        if (sprite.sprites[viewId]) {
                            const s = sprite.sprites[viewId]
                            const t = sprite.tilesets[s.tileSetID]
                            function posToNum(x: number, y: number) {
                                return (((x + 127) & 0xFF) << 8) | ((y + 127) & 0xFF)
                            }
                            function numToPos(v: number) {
                                return {
                                    x: ((v >>> 8) & 0xFF) - 127,
                                    y: (v & 0xFF) - 127
                                }
                            }
                            const fillQueue = [posToNum(targetPos.x, targetPos.y)]
                            const fillSet = new Set(fillQueue)
                            const pixelMap = {}
                            const originalTest = hitTest({
                                sprite: s,
                                tileset: t,
                                blacklist: hiddenSubsprites,
                                x: targetPos.x,
                                y: targetPos.y,
                                transparent: !previewTransparent
                            })
                            if (originalTest) {
                                if (pixelMap[originalTest.tileId]) {
                                    pixelMap[originalTest.tileId].push(originalTest.pixelIndex)
                                } else {
                                    pixelMap[originalTest.tileId] = [originalTest.pixelIndex]
                                }
                                const originalColorIndex = originalTest.pixelColorIndex
                                while (fillQueue.length > 0) {
                                    const posn = fillQueue.pop()!
                                    const pos = numToPos(posn)
                                    function testPos(x: number, y: number) {
                                        const test = hitTest({
                                            sprite: s,
                                            tileset: t,
                                            blacklist: hiddenSubsprites,
                                            x, y,
                                            transparent: !previewTransparent
                                        })
                                        if (test) {
                                            if (test.pixelColorIndex === originalColorIndex) {
                                                const posn = posToNum(x, y)
                                                if (!fillSet.has(posn)) {
                                                    fillQueue.push(posn)
                                                    fillSet.add(posn)
                                                    if (pixelMap[test.tileId]) {
                                                        pixelMap[test.tileId].push(test.pixelIndex)
                                                    } else {
                                                        pixelMap[test.tileId] = [test.pixelIndex]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    testPos(pos.x + 1, pos.y)
                                    testPos(pos.x - 1, pos.y)
                                    testPos(pos.x, pos.y + 1)
                                    testPos(pos.x, pos.y - 1)
                                }
                                if (fillSet.size > 0 && Object.keys(pixelMap).length > 0) {
                                    dispatch(setPixels(colorIndex, s.tileSetID, pixelMap))
                                }
                            }
                        }
                }
            }
        }
    }
    function onCanvasMouseDown(evt: React.MouseEvent<HTMLCanvasElement>) {
        if (usingTool === Tools.Pencil || usingTool === Tools.Eraser) {
            const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
            if (targetPos) {
                setPreviewPixels(prev => prev.add([targetPos.x, targetPos.y]))
            }
        } else if (usingTool === Tools.Rectangle || usingTool === Tools.FilledRectangle || usingTool === Tools.Line) {
            const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
            toolTempRef.current = {
                x: targetPos.x,
                y: targetPos.y
            }
        } else if (usingTool === Tools.MoveSubsprite) {
            if (hitTestResult) {
                const subsprite = sprite.sprites[viewId].subsprites[hitTestResult.subspriteId]
                if (subsprite) {
                    const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
                    toolTempRef.current = {
                        originPos: {
                            x: targetPos.x - subsprite.position.x,
                            y: targetPos.y - subsprite.position.y
                        },
                        x: evt.clientX - evt.currentTarget.offsetLeft,
                        y: evt.clientY - evt.currentTarget.offsetTop,
                        movingSubsprite: hitTestResult
                    }
                }
            }
        }
    }
    function onCanvasMouseMove(evt: React.MouseEvent<HTMLCanvasElement>) {
        if (usingTool === Tools.Pencil || usingTool === Tools.Eraser) {
            if (sprite && previewPixels.size > 0) {
                const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
                if (targetPos) {
                    setPreviewPixels(prev => prev.add([targetPos.x, targetPos.y]))
                }
            }
        }
        setMousePos({
            x: evt.clientX - evt.currentTarget.offsetLeft,
            y: evt.clientY - evt.currentTarget.offsetTop
        })
    }
    function onCanvasMouseUp(evt: React.MouseEvent<HTMLCanvasElement>) {
        if (usingTool === Tools.Pencil || usingTool === Tools.Eraser) {
            if (sprite) {
                switch (viewType) {
                    case 'sprite':
                        if (sprite.sprites[viewId]) {
                            const s = sprite.sprites[viewId]
                            const t = sprite.tilesets[s.tileSetID]
                            const pixelMap = {}
                            for (const [x, y] of previewPixels) {
                                const test = hitTest({
                                    sprite: s,
                                    tileset: t,
                                    blacklist: hiddenSubsprites,
                                    x,
                                    y,
                                    transparent: !previewTransparent
                                })
                                if (test) {
                                    if (pixelMap[test.tileId]) {
                                        pixelMap[test.tileId].push(test.pixelIndex)
                                    } else {
                                        pixelMap[test.tileId] = [test.pixelIndex]
                                    }
                                }
                            }
                            dispatch(setPixels(usingTool === Tools.Eraser ? 0 : colorIndex, s.tileSetID, pixelMap))
                        }
                }
            }
            setPreviewPixels(new Set())
        } else if (usingTool === Tools.Rectangle || usingTool === Tools.FilledRectangle) {
            if (toolTempRef.current) {
                switch (viewType) {
                    case 'sprite':
                        if (sprite.sprites[viewId]) {
                            const s = sprite.sprites[viewId]
                            const t = sprite.tilesets[s.tileSetID]
                            const pixelMap = {}
                            const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
                            const left = Math.min(toolTempRef.current.x, targetPos.x)
                            const top = Math.min(toolTempRef.current.y, targetPos.y)
                            const right = Math.max(toolTempRef.current.x, targetPos.x + 1)
                            const bottom = Math.max(toolTempRef.current.y, targetPos.y + 1)
                            function hitTestAndAdd(x: number, y: number) {
                                const test = hitTest({
                                    sprite: s,
                                    tileset: t,
                                    blacklist: hiddenSubsprites,
                                    x,
                                    y,
                                    transparent: !previewTransparent
                                })
                                if (test) {
                                    if (pixelMap[test.tileId]) {
                                        pixelMap[test.tileId].push(test.pixelIndex)
                                    } else {
                                        pixelMap[test.tileId] = [test.pixelIndex]
                                    }
                                }
                            }
                            if (usingTool === Tools.FilledRectangle) {
                                for (let y = top; y < bottom; y++) {
                                    for (let x = left; x < right; x++) {
                                        hitTestAndAdd(x, y)
                                    }
                                }
                            } else {
                                for (let y = top; y < bottom; y++) {
                                    hitTestAndAdd(left, y)
                                }
                                for (let x = left; x < right; x++) {
                                    hitTestAndAdd(x, top)
                                }
                                for (let y = top; y < bottom; y++) {
                                    hitTestAndAdd(right - 1, y)
                                }
                                for (let x = left; x < right; x++) {
                                    hitTestAndAdd(x, bottom - 1)
                                }
                            }
                            dispatch(setPixels(colorIndex, s.tileSetID, pixelMap))
                        }
                }
            }
        } else if (usingTool === Tools.MoveSubsprite) {
            if (toolTempRef.current) {
                switch (viewType) {
                    case 'sprite':
                        if (sprite.sprites[viewId] && toolTempRef.current) {
                            const subsprite = sprite.sprites[viewId].subsprites[toolTempRef.current.movingSubsprite.subspriteId]
                            const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft + toolTempRef.current.x, evt.clientY - evt.currentTarget.offsetTop + toolTempRef.current.y)
                            const offsetX = targetPos.x + toolTempRef.current.originPos.x
                            const offsetY = targetPos.y + toolTempRef.current.originPos.y
                            const newX = subsprite.position.x + offsetX
                            const newY = subsprite.position.y + offsetY
                            const newSubsprite = {
                                ...subsprite,
                                position: {
                                    x: newX,
                                    y: newY
                                }
                            }
                            const newSubsprites = sprite.sprites[viewId].subsprites.slice()
                            newSubsprites[toolTempRef.current.movingSubsprite.subspriteId] = newSubsprite
                            const newSprite: Sprite = {
                                subsprites: newSubsprites,
                                tileSetID: sprite.sprites[viewId].tileSetID,
                            }
                            const newSprites = sprite.sprites.slice()
                            newSprites[viewId] = newSprite
                            dispatch(setSprite({
                                sprites: newSprites,
                            }))
                        }
                }
            }
        } else if (usingTool === Tools.Line) {
            if (toolTempRef.current) {
                switch (viewType) {
                    case 'sprite':
                        if (sprite.sprites[viewId]) {
                            const s = sprite.sprites[viewId]
                            const t = sprite.tilesets[s.tileSetID]
                            const pixelMap = {}
                            const targetPos = getTarget(evt.clientX - evt.currentTarget.offsetLeft, evt.clientY - evt.currentTarget.offsetTop)
                            function hitTestAndAdd(x: number, y: number) {
                                const test = hitTest({
                                    sprite: s,
                                    tileset: t,
                                    blacklist: hiddenSubsprites,
                                    x,
                                    y,
                                    transparent: !previewTransparent
                                })
                                if (test) {
                                    if (pixelMap[test.tileId]) {
                                        pixelMap[test.tileId].push(test.pixelIndex)
                                    } else {
                                        pixelMap[test.tileId] = [test.pixelIndex]
                                    }
                                }
                            }
                            for (const [x, y] of line(toolTempRef.current.x, toolTempRef.current.y, targetPos.x, targetPos.y)) {
                                hitTestAndAdd(x, y)
                            }
                            dispatch(setPixels(colorIndex, s.tileSetID, pixelMap))
                        }
                }
            }
        }
        toolTempRef.current = null
    }
    function onRedraw() {
        const canvas = canvasRef.current
        let hitTestResult: HitTestResult | null = null
        if (canvas) {
            const ctx = canvas.getContext('2d')
            const gridImg = ctx.createPattern(gridImage as any, 'repeat')
            const scale = canvasView.scale
            ctx.imageSmoothingEnabled = false
            ctx.resetTransform()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.strokeStyle = '#f00'
            ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
            ctx.fillStyle = gridImg
            ctx.lineWidth = 1
            // Draw a rect 256x256 in center of canvas
            const offsetX = (((canvas.width - 256) / 2) | 0) + Math.round(canvasView.x)
            const offsetY = (((canvas.height - 256) / 2) | 0) + Math.round(canvasView.y)

            let debugLine = 10
            function printDebug(text: string) {
                const lastFillStyle = ctx.fillStyle
                const len = ctx.measureText(text)
                ctx.fillStyle = '#FFFA'
                ctx.fillRect(10, debugLine, len.width, 14)
                ctx.fillStyle = '#F00'
                ctx.fillText(text, 10, debugLine)
                debugLine += 14
                ctx.fillStyle = lastFillStyle
            }
            const targetPos = getTarget()
            // const targetX = Math.floor(((mousePos.x - offsetX - 127) / scale))
            // const targetY = Math.floor(((mousePos.y - offsetY - 127) / scale))
            const targetX = targetPos.x
            const targetY = targetPos.y
            // console.log(canvasView)
            ctx.strokeStyle = '#000'
            ctx.translate(offsetX + 127, offsetY + 127)
            ctx.setLineDash([])
            if (canvasView.scale > 5) {
                ctx.strokeStyle = '#0007'
                ctx.beginPath()
                for (let x = -127; x < 130; x++) {
                    ctx.moveTo(x * scale, -127 * scale)
                    ctx.lineTo(x * scale, 130 * scale)
                }
                for (let y = -127; y < 130; y++) {
                    ctx.moveTo(-127 * scale, y * scale)
                    ctx.lineTo(130 * scale, y * scale)
                }
                ctx.closePath()
                ctx.stroke()
            }
            ctx.fillRect(-127 * scale, -127 * scale, 256 * scale, 256 * scale)
            ctx.scale(scale, scale)
            ctx.strokeRect(-127.5, -127.5, 257, 257)
            if (sprite) {
                switch (viewType) {
                    case 'sprite':
                        if (sprite.sprites[viewId]) {
                            const s = sprite.sprites[viewId]
                            const t = sprite.tilesets[s.tileSetID]
                            const p = sprite.palettes[previewPalette] || sprite.palettes[0]
                            renderSprite({
                                sprite: s,
                                tileset: t,
                                palette: p,
                                blacklist: hiddenSubsprites,
                                transparent: !previewTransparent,
                                putPixelCallback: (x, y, color) => {
                                    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                                    ctx.fillRect(x, y, 1, 1)
                                }
                            })
                            ctx.lineWidth = 1 / scale
                            ctx.strokeStyle = '#F00'
                            if (showSubspritesBound) {
                                for (const [i, subsprite] of s.subsprites.entries()) {
                                    if (hiddenSubsprites.has(i)) continue
                                    ctx.strokeRect(subsprite.position.x, subsprite.position.y, subsprite.size.x, subsprite.size.y)
                                }
                            }
                            const color = p[colorIndex] || p[0] || [0, 0, 0]
                            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                            for (const [x, y] of previewPixels) {
                                ctx.fillRect(x, y, 1, 1)
                            }
                            if (usingTool === Tools.Text && textCanvas.current && textCanvas.current.textData) {
                                // console.log(textCanvas.current.textData)
                                ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                                for (let y = 0; y < textCanvas.current.textData.height; y++) {
                                    for (let x = 0; x < textCanvas.current.textData.width; x++) {
                                        const pixel = textCanvas.current.textData.data[(y * textCanvas.current.textData.width + x) * 4 + 3]
                                        if (pixel === 255) {
                                            ctx.fillRect(targetX + x, targetY + y, 1, 1)
                                        }
                                    }
                                }
                            }
                            if (toolTempRef.current) {
                                if (usingTool === Tools.Rectangle) {
                                    const l = Math.min(targetX, toolTempRef.current.x) + 0.5
                                    const t = Math.min(targetY, toolTempRef.current.y) + 0.5
                                    const r = Math.max(targetX, toolTempRef.current.x) + 0.5
                                    const b = Math.max(targetY, toolTempRef.current.y) + 0.5
                                    ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                                    ctx.lineWidth = 1
                                    ctx.strokeRect(l, t, r - l, b - t)
                                } else if (usingTool === Tools.FilledRectangle) {
                                    const l = Math.min(targetX, toolTempRef.current.x)
                                    const t = Math.min(targetY, toolTempRef.current.y)
                                    const r = Math.max(targetX + 1, toolTempRef.current.x)
                                    const b = Math.max(targetY + 1, toolTempRef.current.y)
                                    ctx.fillRect(l, t, r - l, b - t)
                                } else if (usingTool === Tools.Line) {
                                    for (const [x, y] of line(toolTempRef.current.x, toolTempRef.current.y, targetX, targetY)) {
                                        ctx.fillRect(x, y, 1, 1)
                                    }
                                } else if (usingTool === Tools.MoveSubsprite && toolTempRef.current) {
                                    const subsprite = s.subsprites[toolTempRef.current.movingSubsprite.subspriteId]
                                    const offsetX = targetX - toolTempRef.current.originPos.x
                                    const offsetY = targetY - toolTempRef.current.originPos.y
                                    renderSubSprite({
                                        subsprite,
                                        tileset: t,
                                        transparent: !previewTransparent,
                                        putPixelCallback(x, y, pixel) {
                                            const c = p[pixel] || p[0] || [0, 0, 0]
                                            ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`
                                            ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
                                        },
                                    })
                                }
                            }
                            hitTestResult = hitTest({
                                sprite: s,
                                tileset: t,
                                blacklist: hiddenSubsprites,
                                x: targetX,
                                y: targetY,
                                transparent: !previewTransparent,
                            })
                            ctx.strokeStyle = `red`
                            if (hitTestResult) {
                                ctx.lineWidth = 4 / scale
                                const subsprite = s.subsprites[hitTestResult.subspriteId]
                                ctx.strokeRect(subsprite.position.x, subsprite.position.y, subsprite.size.x, subsprite.size.y)
                            }
                            ctx.lineWidth = 2 / scale
                            ctx.strokeRect((targetX | 0), (targetY | 0), 1, 1)
                            setHitTestResult(hitTestResult)
                        }
                }
            }
            ctx.resetTransform()
            ctx.fillStyle = 'red'
            ctx.textBaseline = 'top'
            ctx.font = '14px monospace'
            printDebug(`Mouse Pos: ${mousePos.x} ${mousePos.y}`)
            printDebug(`Pixel Pos: ${targetX} ${targetY}`)
            if (hitTestResult) {
                printDebug(`Hit Test: ${hitTestResult.tileId} ${hitTestResult.pixelIndex}`)
                printDebug(`SubSprite Id: ${hitTestResult.subspriteId}`)
                /*
                printDebug(`SubSprite Info:`)
                for (const line of JSON.stringify(sprite.sprites[viewId].subsprites[hitTestResult.subspriteId], null, 2).split('\n')) {
                  printDebug(`  ${line}`)
                }
                */
                if (usingTool === Tools.Cursor) {
                    setCanvasCursor('default')
                } else {
                    setCanvasCursor('crosshair')
                }
            } else {
                setCanvasCursor('default')
            }
        }
    }
    function onResize() {
        const canvas = canvasRef.current
        if (canvas) {
            const rect = canvas.parentElement.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
            onRedraw()
        }
    }
    function onCanvasScroll(evt: WheelEvent) {
        evt.preventDefault()
        const canvas = canvasRef.current
        if (canvas) {
            if (evt.ctrlKey) {
                // Scale the canvas and follow the mouse

                setCanvasView(prev => ({
                    ...prev,
                    scale: Math.max(1, Math.min(50, prev.scale - (evt.deltaY > 0 ? 0.2 : -0.2))),
                }))
            } else {
                // Scroll the canvas
                if (evt.shiftKey) {
                    setCanvasView(prev => ({
                        ...prev,
                        x: prev.x - (evt.deltaY / 2),
                    }))
                } else {
                    setCanvasView(prev => ({
                        ...prev,
                        y: prev.y - (evt.deltaY / 2),
                    }))
                }
            }
        }
    }
    function onGlobalKeyPress(evt: KeyboardEvent) {
        if (evt.ctrlKey) {
            if ((evt.target as any).nodeName.toLowerCase() === 'input') return
            if ((evt.target as any).nodeName.toLowerCase() === 'textarea') return
            switch (evt.code) {
                case 'KeyZ':
                    evt.preventDefault()
                    dispatch({
                        ...ActionCreators.undo(),
                        type: UNDO
                    })
                    break
                case 'KeyY':
                    evt.preventDefault()
                    dispatch({
                        ...ActionCreators.redo(),
                        type: REDO
                    })
                    break
            }
        }
    }
    useEffect(() => {
        if (canvasRef.current) {
            const o = new ResizeObserver(onResize)
            o.observe(canvasRef.current, {
                box: 'border-box'
            })
            o.observe(canvasRef.current.parentElement, {
                box: 'border-box'
            })
            return () => {
                o.disconnect()
            }
        }
    }, [canvasRef.current])
    useEffect(() => {
        onResize()
    }, [canvasRef.current, currentTab])
    useEffect(() => {
        onRedraw()
    }, [canvasRef.current, viewType, viewId, sprite, canvasView, mousePos, previewPalette, hiddenSubsprites, previewTransparent])
    useEffect(() => {
        window.addEventListener('resize', onResize)
        window.addEventListener('keypress', onGlobalKeyPress)
        if (canvasRef.current) {
            canvasRef.current.addEventListener('wheel', onCanvasScroll)
        }
        return () => {
            window.removeEventListener('resize', onResize)
            window.removeEventListener('keypress', onGlobalKeyPress)
            if (canvasRef.current) {
                canvasRef.current.removeEventListener('wheel', onCanvasScroll)
            }
        }
    }, [canvasRef.current])
    return <div className={styles.canvas}>
        <canvas
            style={{
                cursor: canvasCursor
            }}
            onMouseDown={onCanvasMouseDown}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onClick={onCanvasMouseClick}
            /*
            onClick={evt => hitTestResult && dispatch(setPixels(1, sprite.sprites[viewId].tileSetID, {[hitTestResult.tileId]: [hitTestResult.pixelIndex]}))}
            */
            ref={canvasRef}
        />
    </div>
}
