import { Action, AnyAction } from "redux"
import undoable from "redux-undo"
import { MainStore } from "."
import { Color } from "../utils/color"
import { AnimationFrame, Sprite } from "../utils/sfsprite"

export const initialState = {
    colorMode: false,
    sprites: [] as Sprite[],
    palettes: [] as Color[][],
    animations: [] as AnimationFrame[][],
    tilesets: [] as Uint8Array[][],
}

export type TileMap = {
    [tilesetId: number]: number[]
}
export interface SetPixelsAction extends Action<'sprite/SET_PIXELS'> {
    color: number
    pixels: TileMap
    tilesetId: number
}

export interface SetSpriteAction extends Action<'sprite/SET_SPRITE'> {}

export type SpriteAction = SetPixelsAction | SetSpriteAction

export const SET_SPRITE = 'sprite/SET_SPRITE'
export const SET_PIXELS = 'sprite/SET_PIXELS'

export function setSprite(sprite: Partial<typeof initialState>) {
    return {
        type: SET_SPRITE,
        sprite
    }
}

export function setPixels(color: number, tilesetId: number, pixels: TileMap): SetPixelsAction {
    return {
        type: SET_PIXELS,
        color,
        pixels,
        tilesetId
    }
}

function reducer(state = initialState, action: SpriteAction): typeof initialState {
    switch (action.type) {
        case SET_SPRITE:
            {
                const a = (action as ReturnType<typeof setSprite>).sprite
            return {
                ...state,
                ...a
            }
            }
        case SET_PIXELS:
            {
                const newTilesets = [...state.tilesets]
                const { color, pixels, tilesetId } = action
                if (Number.isSafeInteger(tilesetId) && tilesetId in state.tilesets) {
                    const tileset = state.tilesets[tilesetId]
                    for (const [key, indexes] of Object.entries(pixels)) {
                        const tileId = Number(key)
                        if (Number.isSafeInteger(tileId) && tileId < tileset.length) {
                            const clone = tileset[tileId].slice()
                            for (const index of indexes) {
                                if (Number.isSafeInteger(index) && index < clone.length) {
                                    clone[index] = color
                                }
                            }
                            newTilesets[tilesetId] = newTilesets[tilesetId].slice()
                            newTilesets[tilesetId][tileId] = clone
                        }
                    }
                }
                return {
                    ...state,
                    tilesets: newTilesets
                }
            }
        default:
            return state
    }
}

export const UNDO = 'sprite/UNDO'
export const REDO = 'sprite/REDO'
export const CLEAR_HISTORY = 'sprite/CLEAR_HISTORY'

export function getSprite(state: MainStore): typeof initialState {
    return state.sprite.present
}

export default undoable(reducer, {
    undoType: UNDO,
    redoType: REDO,
    clearHistoryType: CLEAR_HISTORY,
    limit: 256,
})
