import { Action, AnyAction } from 'redux'
import { MainStore } from '.'

export enum Tools {
    Cursor = 'Cursor',
    Pencil = 'Pencil',
    Eraser = 'Eraser',
    Fill = 'Fill',
    Line = 'Line',
    Rectangle = 'Rectangle',
    FilledRectangle = 'Filled Rectangle',
    ColorPicker = 'Color Picker',
    Text = 'Text',
    MoveSubsprite = 'Move Subsprite',
}

export enum FontType {
    Default = 0,
    Game12x12 = 1,
    Simsun12x12 = 2,
    Game8x16Bold = 3,
    Game8x16 = 4,
    Game8x8 = 5,
    Muzai8x16 = 6,
    Guanzhi = 7,
    Simsun10x10 = 8,
    Simsun11x11 = 9,
    
}

export const initialState = {
    viewType: 'sprite' as 'sprite' | 'subsprite' | 'tileset',
    id: 0,
    textToolText: 'Text',
    textToolFont: FontType.Default,
    selectedAnimationId: null,
    selectedAnimationFrame: null,
    usingTool: Tools.Cursor,
    usingColorIndex: 0,
    previewPaletteId: 0,
    previewTransparent: false,
    hiddenSubsprites: new Set<number>()
}

export const SWITCH_TO_SPRITE = 'editing/SWITCH_TO_SPRITE'
export const SWITCH_TO_SUBSPRITE = 'editing/SWITCH_TO_SUBSPRITE'
export const SWITCH_TO_TILESET = 'editing/SWITCH_TO_TILESET'
export const SWITCH_TOOL = 'editing/SWITCH_TOOL'
export const SWITCH_ANIMATION = 'editing/SWITCH_ANIMATION'
export const SWITCH_ANIMATION_FRAME = 'editing/SWITCH_ANIMATION_FRAME'
export const SWITCH_COLOR_INDEX = 'editing/SWITCH_COLOR_INDEX'
export const SWITCH_PREVIEW_PALETTE = 'editing/SWITCH_PREVIEW_PALETTE'
export const TOGGLE_HIDDEN_SUBSPRITE = 'editing/TOGGLE_HIDDEN_SUBSPRITE'
export const TOGGLE_PREVIEW_TRANSPARENT = 'editing/TOGGLE_PREVIEW_TRANSPARENT'
export const SET_TEXT_TOOL_TEXT = 'editing/SET_TEXT_TOOL_TEXT'
export const SET_TEXT_TOOL_FONT = 'editing/SET_TEXT_TOOL_FONT'

interface SwitchAction extends Action {
    type: typeof SWITCH_TO_SPRITE |
        typeof SWITCH_TO_SUBSPRITE |
        typeof SWITCH_TO_TILESET |
        typeof SWITCH_TOOL |
        typeof SWITCH_COLOR_INDEX |
        typeof SWITCH_ANIMATION |
        typeof SWITCH_ANIMATION_FRAME |
        typeof SWITCH_PREVIEW_PALETTE |
        typeof TOGGLE_HIDDEN_SUBSPRITE |
        typeof TOGGLE_PREVIEW_TRANSPARENT |
        typeof SET_TEXT_TOOL_TEXT |
        typeof SET_TEXT_TOOL_FONT
    id: number,
}

interface SwitchToolAction extends Action {
    type: typeof SWITCH_TOOL
    tool: Tools
}

function reducer (state = initialState, action: AnyAction): typeof initialState {
    switch (action.type) {
    case SWITCH_TO_SPRITE:
        return {
            ...state,
            viewType: 'sprite',
            id: action.id,
            hiddenSubsprites: new Set()
        }
    case SWITCH_TO_SUBSPRITE:
        return {
            ...state,
            viewType: 'subsprite',
            id: action.id,
            hiddenSubsprites: new Set()
        }
    case SWITCH_TO_TILESET:
        return {
            ...state,
            viewType: 'tileset',
            id: action.id,
            hiddenSubsprites: new Set()
        }
    case SWITCH_TOOL:
        return {
            ...state,
            usingTool: action.tool
        }
    case SWITCH_COLOR_INDEX:
        return {
            ...state,
            usingColorIndex: action.id
        }
    case SWITCH_ANIMATION:
        return {
            ...state,
            selectedAnimationId: action.id,
            selectedAnimationFrame: 0
        }
    case SWITCH_ANIMATION_FRAME:
        return {
            ...state,
            selectedAnimationFrame: action.id
        }
    case SWITCH_PREVIEW_PALETTE:
        return {
            ...state,
            previewPaletteId: action.id
        }
    case TOGGLE_HIDDEN_SUBSPRITE:
    {
        const hiddenSubsprites = new Set(state.hiddenSubsprites)
        if (hiddenSubsprites.has(action.id)) {
            hiddenSubsprites.delete(action.id)
        } else {
            hiddenSubsprites.add(action.id)
        }
        return {
            ...state,
            hiddenSubsprites
        }
    }
    case TOGGLE_PREVIEW_TRANSPARENT:
        return {
            ...state,
            previewTransparent: !state.previewTransparent
        }
    case SET_TEXT_TOOL_TEXT:
        return {
            ...state,
            textToolText: action.text
        }
    case SET_TEXT_TOOL_FONT:
        return {
            ...state,
            textToolFont: action.font
        }
    default:
        return state
    }
}

export const getViewType = (state: MainStore) => state.editing.viewType
export const getId = (state: MainStore) => state.editing.id
export const getCurrentTool = (state: MainStore) => state.editing.usingTool
export const getSelectedColorIndex = (state: MainStore) => state.editing.usingColorIndex
export const getPreviewPalette = (state: MainStore) => state.editing.previewPaletteId
export const getHiddenSubsprites = (state: MainStore) => state.editing.hiddenSubsprites
export const getTextToolText = (state: MainStore) => state.editing.textToolText
export const getTextToolFont = (state: MainStore) => state.editing.textToolFont
export const isViewingAndSameId = (state: MainStore, viewType: typeof initialState['viewType'], id: number) => state.editing.id === id && state.editing.viewType === viewType
export const isSubspriteVisible = (state: MainStore, id: number) => !state.editing.hiddenSubsprites.has(id)
export const isPreviewTransparent = (state: MainStore) => state.editing.previewTransparent

export const switchToSprite = (id: number): SwitchAction => ({ type: SWITCH_TO_SPRITE, id })
export const switchToSubsprite = (id: number): SwitchAction => ({ type: SWITCH_TO_SUBSPRITE, id })
export const switchToTileset = (id: number): SwitchAction => ({ type: SWITCH_TO_TILESET, id })
export const switchTool = (tool: Tools): SwitchToolAction => ({ type: SWITCH_TOOL, tool })
export const switchColorIndex = (id: number): SwitchAction => ({ type: SWITCH_COLOR_INDEX, id })
export const switchAnimation = (id: number): SwitchAction => ({ type: SWITCH_ANIMATION, id })
export const switchAnimationFrame = (id: number): SwitchAction => ({ type: SWITCH_ANIMATION_FRAME, id })
export const switchPreviewPalette = (id: number): SwitchAction => ({ type: SWITCH_PREVIEW_PALETTE, id })
export const toggleHiddenSubsprite = (id: number): SwitchAction => ({ type: TOGGLE_HIDDEN_SUBSPRITE, id })
export const togglePreviewTransparent = (): SwitchAction => ({ type: TOGGLE_PREVIEW_TRANSPARENT, id: 0 })
export const setTextToolText = (text: string): AnyAction => ({ type: SET_TEXT_TOOL_TEXT, text })
export const setTextToolFont = (font: FontType): AnyAction => ({ type: SET_TEXT_TOOL_FONT, font })

export default reducer
