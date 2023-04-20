import { FontType } from "../reducers/editing";
import font12x12us from "./fonts/font-12x12-us.json";
import font8x16bold from "./fonts/font-cn-8x16-bold.json";
import font8x16 from "./fonts/font-cn-8x16.json";
import fontgb2312 from "./fonts/GB2312.json";

export default class TextCanvas {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	textData: ImageData;
	font: FontType = FontType.Game12x12;
	constructor() {
		this.canvas = document.createElement("canvas");
		this.canvas.width = 256;
		this.canvas.height = 256;
		(this.canvas.style as any).fontSmooth = "never";
		(this.canvas.style as any).webkitFontSmooth = "none";
		this.ctx = this.canvas.getContext("2d");
		this.ctx.font = "12px simsun";
		this.ctx.textBaseline = "top";
		this.ctx.imageSmoothingQuality = "low";
		this.ctx.fillStyle = "black";
		this.ctx.imageSmoothingEnabled = false;
	}

	measureText(text: string): [number, number] {
		switch (this.font) {
			case FontType.Default: {
				const result = this.ctx.measureText(text);
				return [
					result.width,
					result.actualBoundingBoxDescent - result.actualBoundingBoxAscent,
				];
			}
			case FontType.Game12x12: {
				let result = 0;
				for (const char of text) {
					const code = char.charCodeAt(0);
					if (code in font12x12us) {
						result += font12x12us[code][0];
					} else {
						result += this.ctx.measureText(char).width;
					}
				}
				return [result, 12];
			}
			case FontType.Game8x16Bold: {
				let result = 0;
				for (const char of text) {
					const code = char.charCodeAt(0);
					if (code in font8x16bold) {
						result += font8x16bold[code][0];
					} else if (code in fontgb2312) {
						result += fontgb2312[code][0];
					} else {
						result += this.ctx.measureText(char).width;
					}
				}
				return [result, 16];
			}
			case FontType.Game8x16: {
				let result = 0;
				for (const char of text) {
					const code = char.charCodeAt(0);
					if (code in font8x16) {
						result += font8x16[code][0];
					} else if (code in fontgb2312) {
						result += fontgb2312[code][0];
					} else {
						result += this.ctx.measureText(char).width;
					}
				}
				return [result, 16];
			}
			case FontType.Game8x8:
			default:
				return [0, 0];
		}
	}

	copyFontGragh(
		graphData: string,
		graphWidth: number,
		graphHeight: number,
		x: number,
		y: number,
	) {
		for (let yy = 0; yy < graphHeight; yy++) {
			for (let xx = 0; xx < graphWidth; xx++) {
				const pixelIndex = yy * graphWidth + xx;
				if (graphData[pixelIndex] === "1") {
					this.ctx.fillRect(x + xx, y + yy, 1, 1);
				}
			}
		}
	}

	setText(text: string) {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (text.length === 0) return;
		const [width, height] = this.measureText(text);
		console.log(width, height);
		if (Math.floor(width * height) <= 0) {
			return;
		}
		switch (this.font) {
			case FontType.Default:
				this.ctx.fillText(text, 0, 0, 256);
				break;
			case FontType.Game12x12: {
				let offset = 0;
				for (const char of text) {
					const code = char.charCodeAt(0);
					if (code in font12x12us) {
						this.copyFontGragh(font12x12us[code][2], 12, 12, offset, 0);
						offset += font12x12us[code][0];
					} else {
						this.ctx.fillText(char, offset, 0);
						offset += this.ctx.measureText(char).width;
					}
				}
				break;
			}
			case FontType.Game8x16Bold: {
				let offset = 0;
				for (const char of text) {
					const code = char.charCodeAt(0);
					if (code in font8x16bold) {
						this.copyFontGragh(font8x16bold[code][2], 8, 16, offset, 0);
						offset += font8x16bold[code][0];
					} else if (code in fontgb2312) {
						this.copyFontGragh(fontgb2312[code][2], 8, 16, offset, 0);
						offset += fontgb2312[code][0];
					} else {
						this.ctx.fillText(char, offset, 0);
						offset += this.ctx.measureText(char).width;
					}
				}
				break;
			}
			case FontType.Game8x16: {
				let offset = 0;
				for (const char of text) {
					const code = char.charCodeAt(0);
					if (code in font8x16) {
						this.copyFontGragh(font8x16[code][2], 8, 16, offset, 0);
						offset += font8x16[code][0];
					} else if (code in fontgb2312) {
						this.copyFontGragh(fontgb2312[code][2], 8, 16, offset, 0);
						offset += fontgb2312[code][0];
					} else {
						this.ctx.fillText(char, offset, 0);
						offset += this.ctx.measureText(char).width;
					}
				}
				break;
			}
			default:
				this.ctx.fillText(text, 0, 0, 256);
		}
		const imageData = this.ctx.getImageData(0, 0, width, height);
		console.log(this.canvas.toDataURL());
		this.textData = imageData;
	}

	dispose() {
		this.canvas.remove();
	}
}
