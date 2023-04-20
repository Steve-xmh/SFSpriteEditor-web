import { AnyAction } from "redux";
import { MainStore } from ".";
import { SFSpriteReadError } from "../utils/sfsprite";
import { initialState as SpriteInitialState } from "./sprite";
export interface FileEntry {
	filename: string;
	previewUrl: string;
	data: typeof SpriteInitialState;
}

export interface FileOpenErrorEntry {
	filename: string;
	error: SFSpriteReadError;
}

export const initialState = {
	openedFiles: [] as FileEntry[],
	lastOpenError: [] as FileOpenErrorEntry[],
	loading: false,
};

export const ADD_FILE = "file/ADD_FILE";
export const CLOSE_FILE = "file/CLOSE_FILE";
export const CLOSE_ALL_FILES = "file/CLOSE_ALL_FILES";
export const ADD_OPEN_ERROR = "file/ADD_OPEN_ERROR";
export const CLEAR_OPEN_ERROR = "file/CLEAR_OPEN_ERROR";
export const SET_LOADING = "file/SET_LOADING";

function reducer(state = initialState, action: AnyAction): typeof initialState {
	switch (action.type) {
		case ADD_FILE:
			return {
				...state,
				openedFiles: [...state.openedFiles, action.payload],
			};
		case CLOSE_FILE:
			return {
				...state,
				openedFiles: state.openedFiles.filter((_f, i) => i !== action.payload),
			};
		case ADD_OPEN_ERROR:
			return {
				...state,
				lastOpenError: [...state.lastOpenError, action.payload],
			};
		case CLEAR_OPEN_ERROR:
			return {
				...state,
				lastOpenError: [],
			};
		case SET_LOADING:
			return {
				...state,
				loading: action.payload,
			};
		case CLOSE_ALL_FILES:
			return {
				...state,
				openedFiles: [],
			};
		default:
			return state;
	}
}

export const addFile = (
	filename: string,
	previewUrl: string,
	data: typeof SpriteInitialState,
) => ({
	type: ADD_FILE,
	payload: { filename, data, previewUrl },
});
export const closeFile = (fileIndex: number) => ({
	type: CLOSE_FILE,
	payload: fileIndex,
});
export const closeAllFiles = () => ({
	type: CLOSE_ALL_FILES,
});
export const addOpenError = (filename: string, error: SFSpriteReadError) => ({
	type: ADD_OPEN_ERROR,
	payload: { filename, error },
});
export const clearOpenError = () => ({
	type: CLEAR_OPEN_ERROR,
});
export const setLoading = (loading: boolean) => ({
	type: SET_LOADING,
	payload: loading,
});

export const getFiles = (state: MainStore) => state.files.openedFiles;
export const getLastOpenError = (state: MainStore) => state.files.lastOpenError;
export const getLoading = (state: MainStore) => state.files.loading;

export default reducer;
