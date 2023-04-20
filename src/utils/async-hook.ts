import { Inputs, useEffect } from "react/hooks";

export function useAsync<T>(
	asyncFunc: (cancel: () => void) => Promise<T>,
	asyncCallback: (result: T) => Promise<any>,
	inputs?: Inputs,
) {
	useEffect(() => {
		let canceled = false;
		const cancelFunction = () => {
			canceled = true;
		};
		asyncFunc(cancelFunction).then((result) => {
			if (!canceled) asyncCallback(result);
		});
		return cancelFunction;
	}, inputs);
}
