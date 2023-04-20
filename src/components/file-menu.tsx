import { Menu, MenuItem } from "@blueprintjs/core";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useIntl } from "react-intl";
import { BufferReader } from "../utils/buffer";
import {
	SFSprite,
	SFSpriteReadError,
	getSpriteBound,
	renderSprite,
} from "../utils/sfsprite";
import { useSetAtom } from "jotai";
import { openedFilesStatesAtom } from "../states";

const isFilePickerSupported =
	"showOpenFilePicker" in window && "showSaveFilePicker" in window;

export const FileMenu: React.FC = () => {
	const intl = useIntl();
	const openInputRef = useRef<HTMLInputElement>();

	const tempCanvasRef = useRef<HTMLCanvasElement>();
	const setOpenedFilesStates = useSetAtom(openedFilesStatesAtom);

	useLayoutEffect(() => {
		tempCanvasRef.current = document.createElement("canvas");
		return () => {
			tempCanvasRef.current.remove();
			tempCanvasRef.current = null;
		};
	}, []);

	const openFile = useCallback(async (f: File) => {
		const buffer = await f.arrayBuffer();
		const br = new BufferReader(buffer);
		const sprite = new SFSprite();
		try {
			sprite.loadFromFileBuffer(br);
			let preview = "";
            tempCanvasRef.current ??= document.createElement("canvas");
			if (tempCanvasRef.current) {
				if (sprite.animations[0]) {
					const animation = sprite.animations[0];
					const frame = animation[0];
					if (frame) {
						const bound = getSpriteBound(sprite.sprites[0].subsprites);
						tempCanvasRef.current.width = bound.right - bound.left;
						tempCanvasRef.current.height = bound.bottom - bound.top;
						const ctx = tempCanvasRef.current.getContext("2d");
						const imageData = ctx.createImageData(
							tempCanvasRef.current.width,
							tempCanvasRef.current.height,
						);
						renderSprite({
							sprite: sprite.sprites[frame.spriteId],
							tileset:
								sprite.tilesets[sprite.sprites[frame.spriteId].tileSetID],
							palette: sprite.palettes[frame.palette],
							putPixelCallback: (x, y, color) => {
								const index =
									((y - bound.top) * tempCanvasRef.current.width +
										(x - bound.left)) *
									4;
								imageData.data[index] = color[0];
								imageData.data[index + 1] = color[1];
								imageData.data[index + 2] = color[2];
								imageData.data[index + 3] = 255;
							},
						});
						ctx.clearRect(
							0,
							0,
							tempCanvasRef.current.width,
							tempCanvasRef.current.height,
						);
						ctx.putImageData(imageData, 0, 0);
						preview = tempCanvasRef.current.toDataURL();
					}
				}
			}
			setOpenedFilesStates((prev) => [
				...prev,
				{
					history: [
						{
							colorMode: sprite.colorMode,
							sprites: sprite.sprites,
							palettes: sprite.palettes,
							animations: sprite.animations,
							tilesets: sprite.tilesets,
						},
					],
					index: 0,
					fileName: f.name,
					previewImageUrl: preview,
				},
			]);
            console.log("Loaded", sprite)
			return sprite;
		} catch (err) {
			if (err instanceof SFSpriteReadError) {
				// TODO
			}
            console.warn(err)
			return null;
		}
	}, [tempCanvasRef.current]);
    
	const onOpenFileButtonClicked = async (
		evt: React.MouseEvent<HTMLElement>,
	) => {
		evt.preventDefault();
		if (isFilePickerSupported) {
			const files: FileSystemFileHandle[] = await showOpenFilePicker({
				types: [
					{
						description: "MMSF Sprite",
						accept: {
							"application/octet-stream": [".bin", ".sfsprite"],
						},
					},
				],
				excludeAcceptAllOption: true,
				multiple: true,
			});
			if (files.length > 0) {
				if (files.length === 1) {
					const file = files[0]; // TODO: Load more files
					if (file && file.kind === "file") {
						const f = await file.getFile();
						if (await openFile(f)) {
                            // TODO
						}
					}
				} else {
					const promises = files.map(async (file) => {
						if (file && file.kind === "file") {
							const f = await file.getFile();
							return await openFile(f);
						} else {
							return true;
						}
					});
					const isAllSuccess = (await Promise.all(promises)).reduce(
						(acc, cur) => acc && cur,
						true,
					);
					if (isAllSuccess) {
                        // TODO
					}
				}
                // TODO
			}
		} else {
			if (openInputRef.current) {
				openInputRef.current.click();
			}
		}
	};

	const onOpenFilesInputChanged = async (
		evt: React.ChangeEvent<HTMLInputElement>,
	) => {
		evt.preventDefault();
		const files = evt.currentTarget.files;
		if (files.length > 0) {
			if (files.length === 1) {
				const f = files[0];
				const sprite = await openFile(f);
				if (sprite) {
				}
			}
		}
	};

	return (
		<Menu>
			<input
				type="file"
				ref={openInputRef}
				onChange={onOpenFilesInputChanged}
				style={{ display: "none" }}
			/>
			<MenuItem
				text={intl.formatMessage({
					id: "file.new",
					defaultMessage: "New",
				})}
			/>
			<MenuItem
				text={intl.formatMessage({
					id: "file.open",
					defaultMessage: "Open",
				})}
                onClick={onOpenFileButtonClicked}
			/>
			<MenuItem
				text={intl.formatMessage({
					id: "file.save",
					defaultMessage: "Save",
				})}
			/>
			<MenuItem
				text={intl.formatMessage({
					id: "file.saveas",
					defaultMessage: "Save As",
				})}
			/>
		</Menu>
	);
};
