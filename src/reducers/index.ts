import { AnyAction, createStore } from 'redux'
import sprite, {initialState as spriteInitialState} from './sprite'
import tab, {initialState as tabInitialState} from './tab'
import editing, {initialState as editingInitialState} from './editing'
import dialogs, {initialState as dialogsInitialState} from './dialogs'
import options, {initialState as optionsInitialState} from './options'

export interface MainStore {
    tab: ReturnType<typeof tab>
    sprite: ReturnType<typeof sprite>
    editing: ReturnType<typeof editing>
    dialogs: ReturnType<typeof dialogs>
    options: ReturnType<typeof options>
}

const initialState: MainStore = {
    sprite: {
        past: [],
        present: spriteInitialState,
        future: [],
    },
    tab: tabInitialState,
    editing: editingInitialState,
    dialogs: dialogsInitialState,
    options: optionsInitialState
}

function mainReducer(state: MainStore = initialState, action: AnyAction): MainStore {
    return {
        sprite: sprite(state.sprite, action),
        tab: tab(state.tab, action),
        editing: editing(state.editing, action),
        dialogs: dialogs(state.dialogs, action),
        options: options(state.options, action)
    }
}

const store = createStore(mainReducer)

export default store
