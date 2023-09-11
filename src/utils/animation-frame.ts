import { useEffect, useRef } from "react/hooks";

export const useAnimationFrame = (callback: (delta: number) => void) => {
	const requestRef = useRef(0);
	const previousTimeRef = useRef(0);

	const animate = (time: number) => {
		if (previousTimeRef.current !== undefined) {
			const deltaTime = time - previousTimeRef.current;
			callback(deltaTime);
		}
		previousTimeRef.current = time;
		requestRef.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		requestRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(requestRef.current);
	}, []);
};