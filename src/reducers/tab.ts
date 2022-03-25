import { AnyAction } from "redux"
import undoable from "redux-undo"
import { MainStore } from "."

export const initialState = ''

export const SET_TAB = 'tab/SET_TAB'

export function setTab(tabName: string) {
    return {
        type: SET_TAB,
        tabName
    }
}

function reducer(state = initialState, action: AnyAction): string {
    switch (action.type) {
        case SET_TAB:
            if (action.tabName === state) {
                return ''
            } else {
                return action.tabName
            }
        default:
            return state
    }
}

export function getCurrentTab(state: MainStore) {
    return state.tab
}

export default reducer
