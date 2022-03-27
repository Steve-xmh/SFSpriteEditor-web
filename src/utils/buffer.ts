import { Color, gbaToRGB, ndsToRGB, rgbToGBA } from "./color"

export class BufferReader extends Uint8Array {
    private _cursor: number
    private _view: DataView
    constructor(data: ArrayBufferLike | number, start?: number, length?: number) {
        super(data as any, start, length)
        this._cursor = 0
        this._view = new DataView(this.buffer)
    }
    seek(position = 0, offset = 0) {
        if (offset === 0) {
            this._cursor = position
        } else if (offset === 1) {
            this._cursor = this._cursor + position
        } else if (offset === 2) {
            this._cursor = this.length - position
        } else {
            throw new TypeError('Not a correct seek offset')
        }
        return this._cursor
    }
    tell() {
        return this._cursor
    }
    _isInside(position?: number, offset = 0) {
        return Number.isSafeInteger(position) &&
            position >= 0 && position < this.length + offset
    }
    readGBAColor(position?: number) {
        const result = gbaToRGB(this.readUint16(position))
        // console.log('readGBAColor', position || this._cursor - 4, result)
        return result
    }
    readNDSColor(position?: number) {
        // console.log('readNDSColor', position || this._cursor)
        return ndsToRGB(this.readUint16(position))
    }
    /** @returns {Uint8Array} */
    readBytes(size: number, position?: number) {
        if (this._isInside(position)) {
            const r = this.slice(position, position + size)
            if (size !== r.byteLength) {
                throw new Error(`Data has met end of data`)
            }
            return r
        } else {
            this._cursor += size
            return this.readBytes(size, this._cursor - size)
        }
    }
    /**
     * @returns {number}
     */
    readUint8(position?: number) {
        if (this._isInside(position)) {
            const r = this[position]
            // console.log('ReadU8', position, w, r)
            return r
        } else {
            this._cursor += 1
            return this.readUint8(this._cursor - 1)
        }
    }
    /**
     * @returns {number}
     */
    readInt8(position?: number) {
        if (this._isInside(position)) {
            const r = this[position]
            // console.log('ReadI8', position, r)
            return (r << 24) >> 24
        } else {
            this._cursor += 1
            return this.readInt8(this._cursor - 1)
        }
    }
    /**
     * @returns {number}
     */
    readUint16(position?: number) {
        if (this._isInside(position)) {
            const w = this._view.getUint16(position, true)
            // console.log('ReadU16', position, w)
            return w
        } else {
            this._cursor += 2
            return this.readUint16(this._cursor - 2)
        }
    }
    /**
     * @returns {number}
     */
    readUint32(position?: number) {
        if (this._isInside(position)) {
            const w = this._view.getUint32(position, true)
            // console.log('ReadU32', position, w)
            return w
        } else {
            this._cursor += 4
            return this.readUint32(this._cursor - 4)
        }
    }
    writeBytes(data: Uint8Array, position?: number) {
        if (this._isInside(position)) {
            if (this._cursor + data.byteLength > this.byteLength) {
                throw new TypeError('Data reached out')
            }
            this.set(data, position)
        } else {
            this.writeBytes(data, this._cursor)
            this._cursor += data.byteLength
        }
    }
    /**
     * 
     * @param {[number, number, number, number?]} color 
     * @param {number?} position 
     */
    writeGBAColor(color: Color, position?: number) {
        if (color instanceof Array) {
            const c = rgbToGBA(color)
            this.writeUint16(c, position)
        } else {
            throw new TypeError('Color argument is neither number or array consists of numbers')
        }
    }
    /**
     * 
     * @param {number} value 
     * @param {number?} position 
     */
    writeUint16(value: number, position?: number) {
        if (this._isInside(position)) {
            if (position + 2 > this.byteLength) {
                throw new TypeError('Position out of range')
            }
            this._view.setUint16(position, value, true)
        } else {
            this.writeUint16(value, this._cursor)
            this._cursor += 2
        }
    }
    /**
     * 
     * @param {number} value 
     * @param {number?} position 
     */
    writeInt8(value: number, position?: number) {
        if (this._isInside(position)) {
            if (position + 1 > this.byteLength) {
                throw new TypeError('Position out of range')
            }
            this._view.setInt8(position, value)
        } else {
            this.writeInt8(value, this._cursor)
            this._cursor += 1
        }
    }
    /**
     * 
     * @param {number} value 
     * @param {number?} position 
     */
    writeUint8(value: number, position?: number) {
        if (this._isInside(position)) {
            if (position + 1 > this.byteLength) {
                throw new TypeError('Position out of range')
            }
            this._view.setUint8(position, value)
        } else {
            this.writeUint8(value, this._cursor)
            this._cursor += 1
        }
    }
    /**
     * 
     * @param {number} value 
     * @param {number?} position 
     */
    writeUint32(value: number, position?: number) {
        if (this._isInside(position)) {
            if (position + 4 > this.byteLength) {
                throw new TypeError('Position out of range')
            }
            this._view.setUint32(position, value, true)
        } else {
            this.writeUint32(value, this._cursor)
            this._cursor += 4
        }
    }
}
