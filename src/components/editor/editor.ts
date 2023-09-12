import { SpriteState } from "../../states";
import { Color } from "../../utils/color";

export class Editor {
	private ctx: CanvasRenderingContext2D;
	private innerCanvas: OffscreenCanvas;
	private innerCtx: OffscreenCanvasRenderingContext2D;
	private patternCanvas: OffscreenCanvas;
	private patternCtx: OffscreenCanvasRenderingContext2D;
	private scale: number = 1;
	private offset = { x: 0, y: 0 };
	private mousePosition = { x: 0, y: 0 };
	private sprite: SpriteState;
	private selectedTileset: Uint8Array[];
	private selectedPalette: Color[];
	private isTransparent = true;
	private backgroundPattern: CanvasPattern;
	constructor(private canvas: HTMLCanvasElement) {
		this.ctx = this.canvas.getContext("2d");
		this.offset = {
			x: this.canvas.clientWidth / 2 - 128,
			y: this.canvas.clientHeight / 2 - 128,
		};
		this.innerCanvas = new OffscreenCanvas(256, 256);
		this.innerCtx = this.innerCanvas.getContext("2d");

		this.patternCanvas = new OffscreenCanvas(16, 16);
		this.patternCtx = this.patternCanvas.getContext("2d");
		this.patternCtx.fillStyle = "#BFBFBF";
		this.patternCtx.fillRect(0, 0, 16, 16);
		this.patternCtx.fillStyle = "#FFFFFF";
		this.patternCtx.fillRect(0, 0, 8, 8);
		this.patternCtx.fillRect(8, 8, 8, 8);
		this.backgroundPattern = this.ctx.createPattern(
			this.patternCanvas,
			"repeat",
		);
	}

	dispose() {}

	zoomToPoint(x: number, y: number, scale: number) {
		const amount = scale / this.scale;
		this.scale = scale;
		this.offset.x = x - (x - this.offset.x) * amount;
		this.offset.y = y - (y - this.offset.y) * amount;
	}

	setCurrentSprite(sprite: SpriteState) {
		this.sprite = sprite;
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
		this.ctx.fillRect(this.offset.x, this.offset.y, 256 * this.scale, 256 * this.scale);

		this.ctx.translate(this.offset.x, this.offset.y);
		this.ctx.scale(this.scale, this.scale);
		this.ctx.save();

		if (this.sprite) {
			this.ctx.drawImage(this.innerCanvas, 0, 0);
		}

		this.ctx.strokeStyle = "#000";
		this.ctx.lineWidth = 1;
		this.ctx.strokeRect(-0.5, -0.5, 257, 257);

		this.ctx.restore();

		this.ctx.restore();
		this.ctx.fillStyle = "#000";
		this.ctx.fillText(`画布位置：(${this.offset.x}, ${this.offset.y})`, 64, 16);
		this.ctx.restore();
	}

	private redrawHandle: number = 0;
	requestRedraw() {
		if (this.redrawHandle) cancelAnimationFrame(this.redrawHandle);
		this.redrawHandle = requestAnimationFrame(() => this.draw());
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
		// console.log(evt);
		this.requestRedraw();
	}

	clear() {
		this.ctx.resetTransform();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
