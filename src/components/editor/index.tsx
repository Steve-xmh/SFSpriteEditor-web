import { useLayoutEffect, useRef } from "react";
import { Editor } from "./editor";
import { useAtomValue } from "jotai";
import { currentEditStateAtom } from "../../states";

export const EditorCanvas: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const editorRef = useRef<Editor>(null);
	const currentFile = useAtomValue(currentEditStateAtom);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.width = canvas.clientWidth * window.devicePixelRatio;
			canvas.height = canvas.clientHeight * window.devicePixelRatio;
			const editor = new Editor(canvas);
			editor.draw();
			const onResize = () => {
				canvas.width = canvas.clientWidth * window.devicePixelRatio;
				canvas.height = canvas.clientHeight * window.devicePixelRatio;
				editor.draw();
			};
			const onMouseWheel = editor.onMouseWheel.bind(editor);
			canvas.addEventListener("wheel", onMouseWheel, { passive: false });
			window.addEventListener("resize", onResize);
			editorRef.current = editor;
			return () => {
				window.removeEventListener("resize", onResize);
				canvas.removeEventListener("wheel", onMouseWheel);
				editor.dispose();
			};
		}
	}, []);

	useLayoutEffect(() => {
		if (editorRef.current) {
			editorRef.current.setCurrentSprite(currentFile);
			editorRef.current.draw();
		}
	}, [currentFile]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				width: "100%",
				minHeight: "0",
				touchAction: "none",
			}}
		/>
	);
};
