import { atom } from "jotai";
import { AnimationFrame, Sprite } from "../utils/sfsprite";
import { Color } from "../utils/color";

export interface HistoryState<T> {
	history: T[];
	index: number;
}

export interface UpdateAction<T> {
	type: "update" | "undo" | "redo";
	value?: T;
}

export interface SpriteState {
	colorMode: boolean;
	sprites: Sprite[];
	palettes: Color[][];
	animations: AnimationFrame[][];
	tilesets: Uint8Array[][];
}

export interface FileState {
	fileName: string;
	previewImageUrl: string;
}

export const openedFilesStatesAtom = atom<
	(HistoryState<SpriteState> & FileState)[]
>([
	{
		fileName: "unnamed.bin",
		previewImageUrl: "",
		history: [
			{
				colorMode: false,
				sprites: [],
				palettes: [],
				animations: [],
				tilesets: [],
			},
		],
		index: 0,
	},
]);
export const selectedFileStateIndexAtom = atom(0);

export const selectedFileState = atom(
	(get) => get(openedFilesStatesAtom)[get(selectedFileStateIndexAtom)],
	(get, set, action: HistoryState<SpriteState> & FileState) => {
		const index = get(selectedFileStateIndexAtom);
		const history = get(openedFilesStatesAtom).slice();
		set(openedFilesStatesAtom, history.splice(index, 1, action));
	},
);

export const currentEditStateAtom = atom(
	(get) => {
		const { history, index } = get(selectedFileState);
		return history[index];
	},
	(get, set, action: UpdateAction<SpriteState>) => {
		const { history, index, ...others } = get(selectedFileState);
		if (action.type === "update") {
			set(selectedFileState, {
				...others,
				history: [...history.slice(0, index + 1), action.value],
				index: index + 1,
			});
		} else if (action.type === "undo" && index > 0) {
			set(selectedFileState, {
				...others,
				history,
				index: index - 1,
			});
		} else if (action.type === "redo" && index < history.length - 1) {
			set(selectedFileState, {
				...others,
				history,
				index: index + 1,
			});
		}
	},
);
