import { useLayoutEffect, useRef } from "react";
import { Editor, editorAtom } from "./editor";
import { useAtomValue } from "jotai";
import { currentEditStateAtom } from "../../states";

export const EditorCanvas: React.FC = () => {
	const canvasRef = useRef<HTMLDivElement>(null);
	const editor = useAtomValue(editorAtom);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.appendChild(editor.canvas);
			return () => {
				canvas.removeChild(editor.canvas);
			}
		}
	}, [canvasRef.current]);

	return (
		<div
			ref={canvasRef}
			style={{
				width: "100%",
				minHeight: "0",
				touchAction: "none",
			}}
		/>
	);
};
