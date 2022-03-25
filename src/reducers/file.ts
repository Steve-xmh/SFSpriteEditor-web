import { Action, AnyAction } from "redux"
import { MainStore } from "."

export interface FileEntry {
    filename: string
    
}

export const initialState = {
    openedFiles: [] as FileEntry[]
}

interface AddFileAction extends Action {
    type: 'file/ADD_FILE'
    id: number
}

export const SWITCH_TO_SPRITE = 'editing/SWITCH_TO_SPRITE'
export const SWITCH_TO_SUBSPRITE = 'editing/SWITCH_TO_SUBSPRITE'
export const SWITCH_TO_TILESET = 'editing/SWITCH_TO_TILESET'

function reducer(state = initialState, action: AnyAction): typeof initialState {
    switch (action.type) {
        case SWITCH_TO_SPRITE:
            return {
                ...state,
                viewType: 'sprite',
                id: action.id,
            }
        case SWITCH_TO_SUBSPRITE:
            return {
                ...state,
                viewType: 'subsprite',
                id: action.id,
            }
        case SWITCH_TO_TILESET:
            return {
                ...state,
                viewType: 'tileset',
                id: action.id,
            }
        default:
            return state
    }
}

export const getViewType = (state: MainStore) => state.editing.viewType
export const getId = (state: MainStore) => state.editing.id
export const isViewingAndSameId = (state: MainStore, viewType: typeof initialState['viewType'], id: number) => state.editing.id === id && state.editing.viewType === viewType

export const switchToSprite = (id: number): SwitchAction => ({ type: SWITCH_TO_SPRITE, id })
export const switchToSubsprite = (id: number): SwitchAction => ({ type: SWITCH_TO_SUBSPRITE, id })
export const switchToTileset = (id: number): SwitchAction => ({ type: SWITCH_TO_TILESET, id })

export default reducer
