import { atom } from "jotai";

export const isRefreshNeededAtom = atom(false);
export const isOfflineReadyAtom = atom(false);
export const updateSWAtom = atom({
	updateSW: () => {},
});
