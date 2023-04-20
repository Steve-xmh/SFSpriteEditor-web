import { FormattedMessage } from "react-intl";
import { closeDialog, openDialog } from "../reducers/dialogs";
import {
	addFile,
	addOpenError,
	clearOpenError,
	closeAllFiles,
	closeFile,
	getFiles,
	setLoading,
} from "../reducers/files";
import { getSprite, setSprite } from "../reducers/sprite";
import { BufferReader } from "../utils/buffer";
import {
	getSpriteBound,
	renderSprite,
	SFSprite,
	SFSpriteReadError,
	writeSpriteToBuffer,
} from "../utils/sfsprite";
import styles from "./file-side-page.module.css";
import closeSvg from "../assets/close.svg";

export const FileSidePage: React.FC = (props) => {
	const dispatch = useDispatch();
	const sprite = useSelector(getSprite);
	const files = useSelector(getFiles);
	const [supportFilePicker, setSupportFilePicker] = useState(false);
	const [lastSaved, setLastSaved] = useState(null);
	const tempCanvasRef = useRef<HTMLCanvasElement>();
	const openInputRef = useRef<HTMLInputElement>();
	useEffect(() => {
		if ("showOpenFilePicker" in window && "showSaveFilePicker" in window) {
			setSupportFilePicker(true);
		}
		tempCanvasRef.current = document.createElement("canvas");
		return () => {
			tempCanvasRef.current.remove();
			tempCanvasRef.current = null;
		};
	}, []);
	const openFile = async (f: File) => {
		const buffer = await f.arrayBuffer();
		const br = new BufferReader(buffer);
		const sprite = new SFSprite();
		try {
			sprite.loadFromFileBuffer(br);
			let preview = "";
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
			dispatch(addFile(f.name, preview, sprite));
			return sprite;
		} catch (err) {
			if (err instanceof SFSpriteReadError) {
				dispatch(addOpenError(f.name, err));
			}
			return null;
		}
	};
	const onOpenFilesInputChanged = async (
		evt: JSX.TargetedEvent<HTMLInputElement>,
	) => {
		evt.preventDefault();
		const files = evt.currentTarget.files;
		if (files.length > 0) {
			dispatch(clearOpenError());
			dispatch(setLoading(true));
			dispatch(openDialog("loading"));
			if (files.length === 1) {
				const f = files[0];
				const sprite = await openFile(f);
				if (sprite) {
					dispatch(setSprite(sprite));
					dispatch(closeDialog("loading"));
				}
			}
			dispatch(setLoading(false));
		}
	};
	const onOpenFileButtonClicked = async (
		evt: JSX.TargetedMouseEvent<HTMLInputElement>,
	) => {
		evt.preventDefault();
		if (supportFilePicker) {
			const files: FileSystemFileHandle[] = await (
				window as any
			).showOpenFilePicker({
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
				dispatch(clearOpenError());
				dispatch(setLoading(true));
				dispatch(openDialog("loading"));
				if (files.length === 1) {
					const file = files[0]; // TODO: Load more files
					if (file && file.kind === "file") {
						const f = await file.getFile();
						if (await openFile(f)) {
							dispatch(closeDialog("loading"));
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
						dispatch(closeDialog("loading"));
					}
				}
				dispatch(setLoading(false));
			}
		} else {
			if (openInputRef.current) {
				openInputRef.current.click();
			}
		}
	};
	const onSaveFileButtonClicked = async (evt: MouseEvent, saveAs = false) => {
		evt.preventDefault();
		if (supportFilePicker) {
			if (saveAs || !lastSaved) {
				const file: FileSystemFileHandle = await (
					window as any
				).showSaveFilePicker({
					types: [
						{
							description: "MMSF Sprite",
							accept: {
								"application/octet-stream": [".bin", ".sfsprite"],
							},
						},
					],
					excludeAcceptAllOption: true,
				});
				if (file) {
					const writable = await (file as any).createWritable();
					const outputData = writeSpriteToBuffer(sprite);
					await writable.write(outputData);
					await writable.close();
					setLastSaved(file);
				}
			} else {
				const file = lastSaved;
				if (file) {
					const writable = await (file as any).createWritable();
					const outputData = writeSpriteToBuffer(sprite);
					await writable.write(outputData);
					await writable.close();
					setLastSaved(file);
				}
			}
		} else {
			const a = document.createElement("a");
			const outputData = writeSpriteToBuffer(sprite);
			const url = URL.createObjectURL(
				new Blob([outputData], {
					type: "application/octet-stream",
				}),
			);
			a.href = url;
			a.setAttribute("download", "sprite.bin");
			a.click();
			URL.revokeObjectURL(url);
		}
	};
	const onNewFileClicked = (evt: MouseEvent) => {
		evt.preventDefault();
		dispatch(
			setSprite({
				colorMode: false,
				animations: [],
				tilesets: [],
				palettes: [],
				sprites: [],
			}),
		);
	};
	return (
		<div className={styles.filePage}>
			<div className={styles.fileButtons}>
				<button onClick={onNewFileClicked}>
					<FormattedMessage
						id='file.new'
						description='A button that creates new empty SFSprite file'
						defaultMessage='New File'
					/>
				</button>
				<button onClick={onOpenFileButtonClicked}>
					<FormattedMessage
						id="file.open"
						description='A button that open SFSprite file'
						defaultMessage='Open File(s)...'
					/>
				</button>
				<input
					type="file"
					ref={openInputRef}
					onChange={onOpenFilesInputChanged}
					style={{ display: "none" }}
				/>
				<button onClick={(evt) => onSaveFileButtonClicked(evt)}>
					<FormattedMessage
						id='file.save'
						description='A button that save SFSprite file'
						defaultMessage='Save File...'
					/>
				</button>
				<button onClick={(evt) => onSaveFileButtonClicked(evt, true)}>
					<FormattedMessage
						id='file.saveas'
						description='A button that save SFSprite into another file'
						defaultMessage='Save File as...'
					/>
				</button>
				<button
					onClick={(evt) => {
						dispatch(closeAllFiles());
						onNewFileClicked(evt);
					}}
				>
					<FormattedMessage
						id='file.closeall'
						description='A button that close all files'
						defaultMessage='Close all files'
					/>
				</button>
			</div>
			<div className={styles.fileList}>
				<div>
					{files.map((file, i) => (
						<>
							<button
								className={styles.openFileButton}
								onClick={() => {
									dispatch(setSprite(file.data));
									dispatch(switchPreviewPalette(0));
									dispatch(switchToSprite(0));
								}}
							>
								<img src={file.previewUrl} />
								<div>{file.filename}</div>
							</button>
							<button
								className={styles.closeFileButton}
								onClick={() => dispatch(closeFile(i))}
							>
								<img src={closeSvg} />
							</button>
						</>
					))}
				</div>
			</div>
		</div>
	);
};
