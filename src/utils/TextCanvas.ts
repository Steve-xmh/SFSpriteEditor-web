
export default class TextCanvas {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null = null
    textData: ImageData;
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 256
        this.canvas.height = 256;
        (this.canvas.style as any).fontSmooth = 'never';
        (this.canvas.style as any).webkitFontSmooth = 'none'
        this.ctx = this.canvas.getContext('2d')
        this.ctx.font = '12px simsun'
        this.ctx.textBaseline = 'top'
        this.ctx.imageSmoothingQuality = 'low'
        this.ctx.fillStyle = 'black'
        this.ctx.imageSmoothingEnabled = false
    }

    setText(text: string) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if (text.length === 0) return
        const textSize = this.ctx.measureText(text)
        this.ctx.fillText(text, 0, 0, 256)
        const height = textSize.actualBoundingBoxDescent - textSize.actualBoundingBoxAscent
        if (Math.floor(textSize.width * height) <= 0) {
            return
        }
        const imageData = this.ctx.getImageData(0, 0, textSize.width, height)
        console.log(this.canvas.toDataURL())
        this.textData = imageData
    }

    dispose() {
        this.canvas.remove()
    }
}
