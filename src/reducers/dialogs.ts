import { AnyAction } from "redux";
import { MainStore } from ".";

export interface DialogState {
	[dialogId: string]: boolean;
}

export const initialState: DialogState = {};

export const OPEN_DIALOG = "tab/OPEN_DIALOG";
export const CLOSE_DIALOG = "tab/CLOSE_DIALOG";

export function openDialog(dialogId: string) {
	return {
		type: OPEN_DIALOG,
		dialogId,
	};
}

export function closeDialog(dialogId: string) {
	return {
		type: CLOSE_DIALOG,
		dialogId,
	};
}

function reducer(state = initialState, action: AnyAction): DialogState {
	switch (action.type) {
		case OPEN_DIALOG:
			return {
				...state,
				[action.dialogId]: true,
			};
		case CLOSE_DIALOG:
			return {
				...state,
				[action.dialogId]: false,
			};
		default:
			return state;
	}
}

export function getDialog(state: MainStore, dialogId: string) {
	return !!state.dialogs[dialogId];
}

export default reducer;
