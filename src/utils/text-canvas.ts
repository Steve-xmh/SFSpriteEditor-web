import { FontType } from '../reducers/editing'
import font12x12us from './fonts/font-12x12-us.json'
import font8x16bold from './fonts/font-cn-8x16-bold.json'
import font8x16 from './fonts/font-cn-8x16.json'
import fontgb2312 from './fonts/GB2312.json'
import fontSimSun from './fonts/font-simsun-12x12.json'
import fontSimSun10x10 from './fonts/font-simsun-10x10.json'
import fontSimSun11x11 from './fonts/font-simsun-11x11.json'
import fontMuzai from './fonts/font-muzai-8x12.json'
import fontGuanzhi from './fonts/font-guanzhi-8x8.json'

export default class TextCanvas {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    textData: ImageData
    _font: FontType = FontType.Game12x12
    get font () {
        return this._font
    }

    set font (font: FontType) {
        this._font = font
        switch (font) {
        case FontType.Guanzhi:
            this.ctx.font = '8px guanzhi'
            break
        default:
            this.ctx.font = '12px simsun'
        }
    }

    constructor () {
        this.canvas = document.createElement('canvas')
        console.log('text-canvas', this.canvas)
        this.canvas.width = 256
        this.canvas.height = 256
        this.ctx = this.canvas.getContext('2d')
        this.ctx.font = '12px simsun'
        this.ctx.textBaseline = 'top'
        this.ctx.imageSmoothingQuality = 'low'
        this.ctx.fillStyle = 'black'
        this.ctx.imageSmoothingEnabled = false
    }

    measureText (text: string): [number, number] {
        switch (this._font) {
        case FontType.Default:
        {
            const result = this.ctx.measureText(text)
            return [result.width, result.actualBoundingBoxDescent - result.actualBoundingBoxAscent]
        }
        case FontType.Game12x12:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in font12x12us) {
                    result += font12x12us[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 12]
        }
        case FontType.Guanzhi:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontGuanzhi) {
                    result += fontGuanzhi[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 8]
        }
        case FontType.Game8x16Bold:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in font8x16bold) {
                    result += font8x16bold[code][0]
                } else if (code in fontgb2312) {
                    result += fontgb2312[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 16]
        }
        case FontType.Game8x16:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in font8x16) {
                    result += font8x16[code][0]
                } else if (code in fontgb2312) {
                    result += fontgb2312[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 16]
        }
        case FontType.Muzai8x16:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontMuzai) {
                    result += fontMuzai[code][0]
                } else if (code in fontgb2312) {
                    result += fontgb2312[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 16]
        }
        case FontType.Simsun12x12:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontSimSun) {
                    result += fontSimSun[code][0]
                } else if (code in fontgb2312) {
                    result += fontgb2312[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 12]
        }
        case FontType.Simsun10x10:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontSimSun10x10) {
                    result += fontSimSun10x10[code][0]
                } else if (code in fontgb2312) {
                    result += fontgb2312[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 12]
        }
        case FontType.Simsun11x11:
        {
            let result = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontSimSun11x11) {
                    result += fontSimSun11x11[code][0]
                } else if (code in fontgb2312) {
                    result += fontgb2312[code][0]
                } else {
                    result += this.ctx.measureText(char).width
                }
            }
            return [result, 12]
        }
        case FontType.Game8x8:
        default:
            return [0, 0]
        }
    }

    copyFontGragh (graphData: string, graphWidth: number, graphHeight: number, x: number, y: number) {
        for (let yy = 0; yy < graphHeight; yy++) {
            for (let xx = 0; xx < graphWidth; xx++) {
                const pixelIndex = yy * graphWidth + xx
                if (graphData[pixelIndex] === '1') {
                    this.ctx.fillRect(x + xx, y + yy, 1, 1)
                }
            }
        }
    }

    setText (text: string) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if (text.length === 0) return
        const [width, height] = this.measureText(text)
        console.log('Text Size', width, height)
        if (Math.floor(width * height) <= 0) {
            return
        }
        switch (this._font) {
        case FontType.Default:
            this.ctx.fillText(text, 0, 0, 256)
            break
        case FontType.Game12x12:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in font12x12us) {
                    this.copyFontGragh(font12x12us[code][2], 12, 12, offset, 0)
                    offset += font12x12us[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        case FontType.Game8x16Bold:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in font8x16bold) {
                    this.copyFontGragh(font8x16bold[code][2], 8, 16, offset, 0)
                    offset += font8x16bold[code][0]
                } else if (code in fontgb2312) {
                    this.copyFontGragh(fontgb2312[code][2], 8, 16, offset, 0)
                    offset += fontgb2312[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        case FontType.Game8x16:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in font8x16) {
                    this.copyFontGragh(font8x16[code][2], 8, 16, offset, 0)
                    offset += font8x16[code][0]
                } else if (code in fontgb2312) {
                    this.copyFontGragh(fontgb2312[code][2], 8, 16, offset, 0)
                    offset += fontgb2312[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        case FontType.Muzai8x16:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontMuzai) {
                    this.copyFontGragh(fontMuzai[code][2], 8, 16, offset, 0)
                    offset += fontMuzai[code][0]
                } else if (code in fontgb2312) {
                    this.copyFontGragh(fontgb2312[code][2], 8, 16, offset, 0)
                    offset += fontgb2312[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        case FontType.Guanzhi:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontGuanzhi) {
                    this.copyFontGragh(fontGuanzhi[code][2], 8, 8, offset, 0)
                    offset += fontGuanzhi[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        case FontType.Simsun12x12:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontSimSun) {
                    this.copyFontGragh(fontSimSun[code][2], 16, 16, offset, 0)
                    offset += fontSimSun[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        case FontType.Simsun10x10:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontSimSun10x10) {
                    this.copyFontGragh(fontSimSun10x10[code][2], 16, 16, offset, 0)
                    offset += fontSimSun10x10[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        case FontType.Simsun11x11:
        {
            let offset = 0
            for (const char of text) {
                const code = char.charCodeAt(0)
                if (code in fontSimSun11x11) {
                    this.copyFontGragh(fontSimSun11x11[code][2], 16, 16, offset, 0)
                    offset += fontSimSun11x11[code][0]
                } else {
                    this.ctx.fillText(char, offset, 0)
                    offset += this.ctx.measureText(char).width
                }
            }
            break
        }
        default:
            this.ctx.fillText(text, 0, 0, 256)
        }
        const imageData = this.ctx.getImageData(0, 0, width, height)
        console.log("%c+", `font-size: 1px; padding: 128px; image-rendering: pixelated; background-color: white; background-image: url(${this.canvas.toDataURL()}); background-image-repeat: no-repeat; background-image-scale: ${1 / window.devicePixelRatio}; color: transparent;`)
        this.textData = imageData
    }

    dispose () {
        this.canvas.remove()
    }
}
