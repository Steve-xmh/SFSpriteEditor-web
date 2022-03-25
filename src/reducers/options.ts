import { AnyAction } from 'redux'
import lang from '../utils/lang'
import { MainStore } from './index'

export interface Options {
    showSubSpriteBounds: boolean
    showPixelGrid: boolean
    lang: string
}

export const defaultOptions: Options = {
    showSubSpriteBounds: false,
    showPixelGrid: false,
    lang: navigator.language in lang ? navigator.language : 'en'
}

function loadOptions(): Options {
    const option = localStorage.getItem('lang')
    if (option) {
        try {
            return JSON.parse(option)
        } catch (e) {
            return defaultOptions
        }
    } else {
        return defaultOptions
    }
}

function saveOptions(options: Options): Options {
    localStorage.setItem('lang', JSON.stringify(options))
    return options
}

export const initialState: Options = Object.assign({}, loadOptions(), defaultOptions)

export const SET_OPTION = 'options/SET_OPTION'
export const TOGGLE_OPTION = 'options/TOGGLE_OPTION'
export const SWITCH_LANGUAGE = 'options/SWITCH_LANGUAGE'

function reducer(state = initialState, action: AnyAction): Options {
    switch (action.type) {
        case SWITCH_LANGUAGE:
            return saveOptions({
                ...state,
                lang: action.id
            })
        case TOGGLE_OPTION:
            return saveOptions({
                ...state,
                [action.id]: !state[action.id]
            })
        case SET_OPTION:
            return saveOptions({
                ...state,
                [action.id]: action.value
            })
        default:
            return state
    }
}

export const setLanguage = (id: string) => ({
    type: SWITCH_LANGUAGE,
    id
})

export const getLanguage = (state: MainStore) => state.options.lang
export const getOption = <K extends keyof Options>(state: MainStore, id: K): Options[K] => state.options[id]


export default reducer
