export class Editor {
	private ctx: CanvasRenderingContext2D;
	private scale: number = 1;
	private offset = { x: 0, y: 0 };
	constructor(private canvas: HTMLCanvasElement) {
		this.ctx = this.canvas.getContext("2d");
	}

	public zoomToPoint(x: number, y: number, scale: number) {
        console.log(x, y, scale);
    }

	public draw() {
		this.clear();
		this.ctx.fillStyle = "#BBB";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
		this.ctx.save();
		this.ctx.translate(this.offset.x, this.offset.y);
		this.ctx.scale(this.scale, this.scale);
		this.ctx.save();

		this.ctx.fillStyle = "#FFF";
		this.ctx.strokeStyle = "#000";
		this.ctx.lineWidth = 1;
		this.ctx.fillRect(0.5, 0.5, 256, 256);
		this.ctx.strokeRect(0.5, 0.5, 256, 256);

		this.ctx.restore();
        
        
		this.ctx.restore();
		this.ctx.fillStyle = "#000";
        this.ctx.fillText(`画布位置：(${this.offset.x}, ${this.offset.y})`, 64, 16);
		this.ctx.restore();
	}

	private redrawHandle: number = 0;
	public requestRedraw() {
		if (this.redrawHandle) cancelAnimationFrame(this.redrawHandle);
		this.redrawHandle = requestAnimationFrame(() => this.draw());
	}

	public onMouseWheel(evt: WheelEvent) {
		evt.preventDefault();
		evt.stopPropagation();
		evt.stopImmediatePropagation();
		if (evt.ctrlKey) {
			const target = evt.target as HTMLCanvasElement;
            const mouseX = (evt.clientX - target.offsetLeft) * window.devicePixelRatio;
            const mouseY = (evt.clientY - target.offsetTop) * window.devicePixelRatio;
            console.log(evt);
            this.scale = Math.max(1, this.scale + evt.deltaY / 100);
			// Zoom
            this.zoomToPoint(mouseX, mouseY, this.scale);
		} else {
			this.offset.x -= evt.deltaX;
			this.offset.y -= evt.deltaY;
            this.offset.x = Math.max(0, this.offset.x)
            this.offset.y = Math.max(0, this.offset.y)
            this.offset.x = Math.min(this.canvas.width / window.devicePixelRatio - 256, this.offset.x)
            this.offset.y = Math.min(this.canvas.height / window.devicePixelRatio - 256, this.offset.y)
		}
		// console.log(evt);
		this.requestRedraw();
	}

	public clear() {
		this.ctx.resetTransform();
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
