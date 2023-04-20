import { atom } from "jotai";
import { MainStore } from "./index";

export const needRefresh = () => ({ type: NEED_REFRESH });
export const offlineReady = () => ({ type: OFFLINE_READY });
export const setUpdateSW = (updateSW: Function) => ({
	type: SET_UPDATE_SW,
	updateSW,
});

export const isRefreshNeeded = atom(false);
export const isOfflineReady = atom(false);
export const getUpdateSW = atom(() => {});
