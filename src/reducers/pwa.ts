import { AnyAction } from 'redux'
import lang from '../utils/lang'
import { MainStore } from './index'

export interface Options {
    needRefresh: boolean
    offlineReady: boolean
    updateSW: Function
}

export const initialState: Options = {
    needRefresh: false,
    offlineReady: false,
    updateSW: () => { }
}

export const NEED_REFRESH = 'options/NEED_REFRESH'
export const OFFLINE_READY = 'options/OFFLINE_READY'
export const SET_UPDATE_SW = 'options/SET_UPDATE_SW'

function reducer(state = initialState, action: AnyAction): Options {
    switch (action.type) {
        case NEED_REFRESH:
            return {
                ...state,
                needRefresh: true
            }
        case OFFLINE_READY:
            return {
                ...state,
                offlineReady: true
            }
        case SET_UPDATE_SW:
            return {
                ...state,
                updateSW: action.updateSW
            }
        default:
            return state
    }
}

export const needRefresh = () => ({ type: NEED_REFRESH })
export const offlineReady = () => ({ type: OFFLINE_READY })
export const setUpdateSW = (updateSW: Function) => ({ type: SET_UPDATE_SW, updateSW })

export const isRefreshNeeded = (state: MainStore) => state.pwa.needRefresh
export const isOfflineReady = (state: MainStore) => state.pwa.offlineReady
export const getUpdateSW = (state: MainStore) => state.pwa.updateSW

export default reducer
