import lang from "../utils/lang";
import { atomWithStorage, selectAtom } from "jotai/utils";
import { atom } from "jotai";

export interface Options {
	displayDebugMessages: boolean;
	showSubSpriteBounds: boolean;
	showPixelGrid: boolean;
	lang: string;
}

export const defaultOptions: Options = {
	displayDebugMessages: false,
	showSubSpriteBounds: false,
	showPixelGrid: false,
	lang: navigator.language in lang ? navigator.language : "en",
};

export const optionsAtom = atomWithStorage<Options>("options", defaultOptions);

export const setLanguage = atom(null, (get, set) => {
	const lang = get(optionsAtom).lang;
	set(optionsAtom, { ...get(optionsAtom), lang });
});

export const toggleOption = atom(null, (get, set) => {
	const id = get(optionsAtom).lang;
	set(optionsAtom, { ...get(optionsAtom), [id]: !get(optionsAtom)[id] });
});

export const setOption = atom(null, (get, set, value) => {
	const id = get(optionsAtom).lang;
	set(optionsAtom, { ...get(optionsAtom), [id]: value });
});

export const getLanguage = (state: MainStore) => state.options.lang;
