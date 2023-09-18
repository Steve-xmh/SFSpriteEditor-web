import { atom } from "jotai";
import { SpriteState } from "../../states";
import { SFSpriteEditor } from "../../../src-wasm/pkg";

export class Editor {
	private ctx: CanvasRenderingContext2D;
	private innerCanvas = new OffscreenCanvas(256, 256);
	private innerCtx = this.innerCanvas.getContext("2d");
	private patternCanvas = new OffscreenCanvas(16, 16);
	private patternCtx = this.patternCanvas.getContext("2d");
	private tempOpPreviewCanvas = new OffscreenCanvas(256, 256);
	private tempOpPreviewCtx = this.tempOpPreviewCanvas.getContext("2d");
	private scale = 2;
	private offset = { x: 0, y: 0 };
	private mousePosition = { x: 0, y: 0 };
	private sprite: SpriteState;
	private backgroundPattern: CanvasPattern;
	private sizeObserver: ResizeObserver;
	readonly editor = new SFSpriteEditor();
	readonly drawBuffer: ImageData;
	constructor(
		readonly canvas: HTMLCanvasElement = document.createElement("canvas"),
	) {
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		canvas.style.touchAction = "none";
		canvas.addEventListener("wheel", this.onMouseWheel.bind(this));
		canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
		this.sizeObserver = new ResizeObserver(() => {
			const width = this.canvas.clientWidth * window.devicePixelRatio;
			const height = this.canvas.clientHeight * window.devicePixelRatio;
			const size = 128 * this.scale;
			this.offset.x = this.canvas.clientWidth / 2 - size;
			this.offset.y = this.canvas.clientHeight / 2 - size;
			this.canvas.width = width;
			this.canvas.height = height;
			this.requestRedraw();
		});
		this.sizeObserver.observe(this.canvas);
		this.ctx = this.canvas.getContext("2d");
		this.offset = {
			x: canvas.clientWidth / 2 - 128 * this.scale,
			y: canvas.clientHeight / 2 - 128 * this.scale,
		};
		
		this.patternCtx.fillStyle = "#BFBFBF";
		this.patternCtx.fillRect(0, 0, 16, 16);
		this.patternCtx.fillStyle = "#FFFFFF";
		this.patternCtx.fillRect(0, 0, 8, 8);
		this.patternCtx.fillRect(8, 8, 8, 8);
		this.backgroundPattern = this.ctx.createPattern(
			this.patternCanvas,
			"repeat",
		);
		this.drawBuffer = this.ctx.createImageData(256, 256);
		window.sfeditor = this;
	}

	dispose() {
		this.sizeObserver.disconnect();
	}

	loadFromData(data: Uint8Array) {
		console.log("loadFromData", data);
		this.editor.loadFromData(data);
		this.redrawBuffer();
		this.requestRedraw();
	}

	zoomToPoint(x: number, y: number, scale: number) {
		const amount = scale / this.scale;
		this.scale = scale;
		this.offset.x = x - (x - this.offset.x) * amount;
		this.offset.y = y - (y - this.offset.y) * amount;
	}

	setCurrentSprite(sprite: SpriteState) {
		this.sprite = sprite;
	}

	redrawBuffer() {
		const data = this.drawBuffer.data;
		data.fill(0);
		this.editor.renderSprite(0, 0, true, (x: number, y: number, c: number) => {
			const ax = x + 128;
			const ay = y + 128;
			const i = ax + ay * this.drawBuffer.width;
			const r = (c >> 16) & 0xff;
			const g = (c >> 8) & 0xff;
			const b = c & 0xff;
			data[i * 4] = r;
			data[i * 4 + 1] = g;
			data[i * 4 + 2] = b;
			data[i * 4 + 3] = 255;
		});
	}

	draw() {
		this.clear();
		this.ctx.fillStyle = "#BBB";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.save();

		this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

		this.ctx.save();

		this.ctx.imageSmoothingEnabled = false;
		this.ctx.fillStyle = this.backgroundPattern;
		this.ctx.fillRect(
			this.offset.x,
			this.offset.y,
			256 * this.scale,
			256 * this.scale,
		);

		this.ctx.translate(this.offset.x, this.offset.y);
		this.ctx.scale(this.scale, this.scale);
		this.ctx.save();

		if (this.editor) {
			this.innerCtx.putImageData(this.drawBuffer, 0, 0);
			this.ctx.drawImage(this.innerCanvas, 0, 0);
		}

		this.ctx.strokeStyle = "#000";
		this.ctx.lineWidth = 1;
		this.ctx.setLineDash([]);
		this.ctx.strokeRect(-0.5, -0.5, 257, 257);
		// paint editor point
		this.ctx.lineWidth = 0.1;
		this.ctx.strokeStyle = "#F00";
		this.ctx.strokeRect(this.editorPointPosition.x + 128, this.editorPointPosition.y + 128, 1, 1);

		this.ctx.restore();

		this.ctx.restore();
		this.ctx.fillStyle = "#000";

		const debugOutputs = [];

		debugOutputs.push(`画布位置：(${this.offset.x}, ${this.offset.y})`);
		debugOutputs.push(
			`编辑器光标位置：(${this.editorPointPosition.x}, ${this.editorPointPosition.y})`,
		);

		try {
			const hitTestResult = this.editor.hittest(
				0,
				this.editorPointPosition.x,
				this.editorPointPosition.y,
				true,
			);
			if (hitTestResult) {
				const { pixel_index, sprite_obj_id, tile_id } = hitTestResult;
				debugOutputs.push(...JSON.stringify({
					pixel_index,
					sprite_obj_id,
					tile_id,
				}, null, 4).split("\n"));
				hitTestResult.free();
			}
		} catch(err) {
			debugOutputs.push(err?.message);
			console.warn(err);
		}

		let logY = 16;
		for (const line of debugOutputs) {
			this.ctx.fillText(line, 256, logY);
			logY += 16;
		}
		this.ctx.restore();
	}

	private redrawHandle = 0;
	requestRedraw() {
		if (this.redrawHandle) cancelAnimationFrame(this.redrawHandle);
		this.redrawHandle = requestAnimationFrame(() => this.draw());
	}
	private readonly editorPointPosition = { x: 0, y: 0 };
	onMouseMove(evt: MouseEvent) {
		const editorX = (evt.offsetX - this.offset.x) / this.scale - 128;
		const editorY = (evt.offsetY - this.offset.y) / this.scale - 128;
		this.editorPointPosition.x = Math.floor(editorX);
		this.editorPointPosition.y = Math.floor(editorY);
		this.requestRedraw();
	}

	onMouseWheel(evt: WheelEvent) {
		evt.preventDefault();
		evt.stopPropagation();
		evt.stopImmediatePropagation();
		if (evt.ctrlKey) {
			this.mousePosition.x = evt.offsetX;
			this.mousePosition.y = evt.offsetY;
			const targetScale = Math.max(1, this.scale - evt.deltaY / 100);
			this.zoomToPoint(this.mousePosition.x, this.mousePosition.y, targetScale);
		} else {
			if (evt.shiftKey) {
				this.offset.x -= evt.deltaY;
				this.offset.y -= evt.deltaX;
			} else {
				this.offset.x -= evt.deltaX;
				this.offset.y -= evt.deltaY;
			}
			this.offset.x = Math.min(
				this.canvas.width / window.devicePixelRatio,
				this.offset.x,
			);
			this.offset.y = Math.min(
				this.canvas.height / window.devicePixelRatio,
				this.offset.y,
			);
		}
		this.offset.x = Math.round(this.offset.x);
		this.offset.y = Math.round(this.offset.y);
		// console.log(evt);
		this.requestRedraw();
	}

	clear() {
		this.ctx.resetTransform();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}

export const editorAtom = atom(new Editor());
