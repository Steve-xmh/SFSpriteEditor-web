import { BufferReader } from "./buffer";
import { Color } from "./color";
import * as wasm from "../../src-wasm/pkg";

window.wasm = wasm;

export class SFSpriteReadError extends Error {
	constructor(public readonly errorId: number = 0) {
		super(`SFSpriteReadError: ${errorId}`);
	}
}
export class HeaderTooSmallReadError extends SFSpriteReadError {
	constructor(public readonly fileSize: number) {
		super(1);
	}
}
export class TilesetsHeaderOverflowReadError extends SFSpriteReadError {
	constructor(
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(2);
	}
}
export class PalettesHeaderOverflowReadError extends SFSpriteReadError {
	constructor(
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(3);
	}
}
export class SpritesHeaderOverflowReadError extends SFSpriteReadError {
	constructor(
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(4);
	}
}
export class AnimationsHeaderOverflowReadError extends SFSpriteReadError {
	constructor(
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(5);
	}
}

export class PalettesAddressOverflowReadError extends SFSpriteReadError {
	constructor(
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(6);
	}
}
export class SpritesAddressOverflowReadError extends SFSpriteReadError {
	constructor(
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(7);
	}
}
export class TilesetsAddressOverflowReadError extends SFSpriteReadError {
	constructor(
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(8);
	}
}
export class TilesetsEOFReadError extends SFSpriteReadError {
	constructor(
		public readonly tilesetId: number,
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(9);
	}
}
export class TilesetsWrongPositionReadError extends SFSpriteReadError {
	constructor(
		public readonly tilesetId: number,
		public readonly fileSize: number,
		public readonly address: number,
	) {
		super(10);
	}
}
export class TilesetsWrongSizeReadError extends SFSpriteReadError {
	constructor(
		public readonly tilesetId: number,
		public readonly fileSize: number,
		public readonly address: number,
		public readonly size: number,
	) {
		super(11);
	}
}

export class UnsupportedColorModeReadError extends SFSpriteReadError {
	constructor(public readonly colorDepth: number) {
		super(12);
	}
}
export class NoLastSubspriteMarkReadError extends SFSpriteReadError {
	constructor(public readonly spriteId: number) {
		super(13);
	}
}

function getObjSize(objSize: number, objShape: number) {
	switch (((objSize & 0b11) << 4) | (objShape & 0b11)) {
		case 0x00:
			return { x: 8, y: 8 };
		case 0x01:
			return { x: 16, y: 8 };
		case 0x02:
			return { x: 8, y: 16 };
		case 0x10:
			return { x: 16, y: 16 };
		case 0x11:
			return { x: 32, y: 8 };
		case 0x12:
			return { x: 8, y: 32 };
		case 0x20:
			return { x: 32, y: 32 };
		case 0x21:
			return { x: 32, y: 16 };
		case 0x22:
			return { x: 16, y: 32 };
		case 0x30:
			return { x: 64, y: 64 };
		case 0x31:
			return { x: 64, y: 32 };
		case 0x32:
			return { x: 32, y: 64 };
		default:
			throw new Error("Invalid obj size");
	}
}

function getObjSizeCode(objSize: { x: number; y: number }) {
	if (objSize.x === 8 && objSize.y === 8) return { size: 0, shape: 0 };
	else if (objSize.x === 16 && objSize.y === 8) return { size: 0, shape: 1 };
	else if (objSize.x === 8 && objSize.y === 16) return { size: 0, shape: 2 };
	else if (objSize.x === 16 && objSize.y === 16) return { size: 1, shape: 0 };
	else if (objSize.x === 32 && objSize.y === 8) return { size: 1, shape: 1 };
	if (objSize.x === 8 && objSize.y === 32) return { size: 1, shape: 2 };
	if (objSize.x === 32 && objSize.y === 32) return { size: 2, shape: 0 };
	if (objSize.x === 32 && objSize.y === 16) return { size: 2, shape: 1 };
	if (objSize.x === 16 && objSize.y === 32) return { size: 2, shape: 2 };
	if (objSize.x === 64 && objSize.y === 64) return { size: 3, shape: 0 };
	if (objSize.x === 64 && objSize.y === 32) return { size: 3, shape: 1 };
	if (objSize.x === 32 && objSize.y === 64) return { size: 3, shape: 2 };
	throw new Error("Invalid obj size");
}

export function getSpriteBound(subsprites: SubSprite[]) {
	const result = { top: 0, bottom: 0, left: 0, right: 0 };
	for (const subsprite of subsprites) {
		result.right = Math.max(
			result.right,
			subsprite.position.x + subsprite.size.x,
		);
		result.bottom = Math.max(
			result.bottom,
			subsprite.position.y + subsprite.size.y,
		);
		result.left = Math.min(result.left, subsprite.position.x);
		result.top = Math.min(result.top, subsprite.position.y);
	}
	return result;
}

export function renderSubSprite({
	subsprite = {} as SubSprite,
	tileset = [] as Uint8Array[],
	putPixelCallback = null as (
		x: number,
		y: number,
		pixel: number,
	) => void | null,
	transparent = true,
}) {
	const sizey = subsprite.size.y / 8;
	const sizex = subsprite.size.x / 8;
	const filpX = subsprite.flip.h;
	const filpY = subsprite.flip.v;
	for (let ty = 0; ty < sizey; ty++) {
		for (let tx = 0; tx < sizex; tx++) {
			const tileNum =
				subsprite.startTile +
				(filpY ? sizey - 1 - ty : ty) * sizex +
				(filpX ? sizex - 1 - tx : tx);
			if (tileNum >= tileset.length) {
				continue;
			}
			const tile = tileset[tileNum];

			for (let py = 0; py < 8; py++) {
				for (let px = 0; px < 8; px++) {
					const pixel = tile[(filpY ? 7 - py : py) * 8 + (filpX ? 7 - px : px)];
					if (transparent && pixel === 0) {
						continue;
					}

					if (putPixelCallback) {
						putPixelCallback(tx * 8 + px, ty * 8 + py, pixel);
					}
				}
			}
		}
	}
}

export function renderSprite({
	sprite = {} as Sprite,
	tileset = [] as Uint8Array[],
	palette = [] as Color[],
	transparent = true,
	blacklist = new Set(),
	putPixelCallback = null as (x: number, y: number, color: Color) => void,
}) {
	let index = 0;
	for (const subsprite of sprite.subsprites) {
		if (subsprite.prohibited || blacklist.has(index++)) {
			continue;
		}
		renderSubSprite({
			subsprite,
			tileset,
			transparent,
			putPixelCallback(x, y, pixel) {
				putPixelCallback(
					subsprite.position.x + x,
					subsprite.position.y + y,
					palette[pixel],
				);
			},
		});
	}
}

export interface WriteOption {
	colorMode: boolean;
	sprites: Sprite[];
	tilesets: Uint8Array[][];
	palettes: Color[][];
	animations: AnimationFrame[][];
}

export function writeSpriteToBuffer(options: WriteOption) {
	// 计算数据的大小
	// File Header
	let size = 4 * 5;

	// Tileset Header
	size += 2 * 4;

	// Palette Header
	size += 2 * 2;

	// Animation Header
	size += 2 * 2;

	// Sprite Header
	size += 2 * 2;

	// Tileset
	const tileSize = options.colorMode ? 0x40 : 0x20;
	const tilesetHeaderSize = options.sprites.length * 4;
	const tilesetSize = options.tilesets
		.map((v) => v.map((i) => i.byteLength).reduce((p, c) => p + c, 0))
		.map((v) => (v / (options.colorMode ? 1 : 2)) | 0)
		.reduce((p, c) => p + c, 0);

	console.log(tilesetHeaderSize);
	console.log(tilesetSize);

	size += tilesetHeaderSize;
	size += tilesetSize;

	// Palettes
	if (options.colorMode) {
		size += 2 * 256;
	} else {
		size += options.palettes.length * 16 * 2;
	}

	// Animations
	const animationEntries = options.animations.length;
	const animationFrames = options.animations.reduce((p, c) => p + c.length, 0);

	console.log(animationEntries);
	console.log(animationFrames);

	size += animationEntries * 4;
	size += animationFrames * 4;

	// Sprites
	const spriteEntries = options.sprites.length;
	const subsprites = options.sprites.reduce(
		(p, c) => p + c.subsprites.length,
		0,
	);

	console.log(spriteEntries);
	console.log(subsprites);

	size += spriteEntries * 4;
	size += subsprites * 8;

	const result = new BufferReader(size);

	result.seek(4 * 4);
	result.writeUint32(1);

	// Tileset Header
	const tilesetHeaderPos = result.tell();
	result.writeUint16((tilesetSize / tileSize) | 0);
	result.writeUint16((tilesetSize / tileSize) | 0);
	result.writeUint16(2 * 4 + tilesetHeaderSize);
	result.writeUint16(0);

	const tilesetOffsets = [];
	const tilesetSizes = [];
	let tilesetOffset = 0;

	// Tileset
	// 先写数据，记录每段位移
	result.seek(tilesetHeaderPos + tilesetHeaderSize + 2 * 4);
	for (const tileset of options.tilesets) {
		for (const tile of tileset) {
			if (options.colorMode) {
				result.writeBytes(tile);
			} else {
				const transformed = [];
				for (let i = 0; i < ((tile.length / 2) | 0); i++) {
					const a = tile[i * 2] & 0xf;
					const b = tile[i * 2 + 1] & 0xf;
					transformed.push((a | (b << 4)) & 0xff);
				}
				result.writeBytes(new Uint8Array(transformed));
			}
		}
		tilesetSizes.push(tileset.length);
		tilesetOffsets.push(tilesetOffset);
		tilesetOffset += tileset.length;
	}
	const paletteHeaderPos = result.tell();
	result.seek(tilesetHeaderPos + 2 * 4);
	// 再写头信息
	for (const sprite of options.sprites) {
		result.writeUint16(tilesetSizes[sprite.tileSetID]);
		result.writeUint16(tilesetOffsets[sprite.tileSetID]);
	}
	result.seek(paletteHeaderPos);

	// Palette
	if (options.colorMode) {
		result.writeUint16(6);
	} else {
		result.writeUint16(5);
	}
	result.writeUint16(options.palettes.length);
	for (const palette of options.palettes) {
		for (const color of palette) {
			result.writeGBAColor(color);
		}
	}

	// Animations
	const animationHeaderPos = result.tell();
	result.writeUint16(options.animations.length);
	result.writeUint16(0);
	const animationOffsets = [];

	result.seek(animationHeaderPos + 2 * 2 + options.animations.length * 4);
	for (const frames of options.animations) {
		animationOffsets.push(result.tell() - animationHeaderPos);
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i];
			result.writeUint8(frame.spriteId);
			result.writeUint8(frame.delay);
			let loopFlag = 0;
			if (frame.isLoop) {
				loopFlag |= 0x40;
			}
			if (i === frames.length - 1) {
				loopFlag |= 0xc0;
			}
			result.writeUint8(loopFlag);
			result.writeUint8(frame.palette);
		}
	}
	const spritesHeaderPos = result.tell();
	result.seek(animationHeaderPos + 2 * 2);
	for (const offset of animationOffsets) {
		result.writeUint32(offset);
	}

	// Sprites
	result.seek(spritesHeaderPos);
	result.writeUint16(options.sprites.length);
	result.writeUint16(0);
	const spritesOffsets = [];
	const tileNumShift = options.colorMode ? 0 : 1;

	result.seek(spritesHeaderPos + 2 * 2 + options.sprites.length * 4);
	for (const subsprites of options.sprites) {
		spritesOffsets.push(result.tell() - spritesHeaderPos);
		for (let i = 0; i < subsprites.subsprites.length; i++) {
			const subsprite = subsprites.subsprites[i];
			const objSize = getObjSizeCode(subsprite.size);
			result.writeUint8((subsprite.startTile >>> tileNumShift) & 0xff);
			result.writeInt8(subsprite.position.x);
			result.writeInt8(subsprite.position.y);
			result.writeUint8(objSize.size);
			result.writeUint8(objSize.shape);
			let flip = 0;
			flip = flip | (subsprite.flip.h ? 0x1 : 0);
			flip = flip | (subsprite.flip.v ? 0x2 : 0);
			result.writeUint8(flip);
			result.writeUint8(i === subsprites.subsprites.length - 1 ? 1 : 0);
			const upper = (subsprite.startTile >>> (8 + tileNumShift)) & 0xff;
			result.writeUint8(upper);
		}
	}
	result.seek(spritesHeaderPos + 2 * 2);
	for (const offset of spritesOffsets) {
		result.writeUint32(offset);
	}

	// 回到开头写入各数据位移
	result.seek(0);
	result.writeUint32(tilesetHeaderPos);
	result.writeUint32(paletteHeaderPos);
	result.writeUint32(animationHeaderPos);
	result.writeUint32(spritesHeaderPos);
	result.writeUint32(1);

	return result.buffer;
}

export interface HitTestResult {
	tileId: number;
	pixelIndex: number;
	pixelColorIndex: number;
	subspriteId: number;
}

export function hitTest({
	sprite = {} as Sprite,
	tileset = [] as Uint8Array[],
	blacklist = new Set(),
	x = 0,
	y = 0,
	transparent = true,
}): HitTestResult | null {
	for (let index = sprite.subsprites.length - 1; index >= 0; index--) {
		const subsprite = sprite.subsprites[index];
		if (subsprite.prohibited || blacklist.has(index)) {
			continue;
		}
		if (
			x >= subsprite.position.x &&
			y >= subsprite.position.y &&
			x < subsprite.position.x + subsprite.size.x &&
			y < subsprite.position.y + subsprite.size.y
		) {
			const sizex = subsprite.size.x / 8;
			const sizey = subsprite.size.y / 8;
			const filpX = subsprite.flip.h;
			const filpY = subsprite.flip.v;
			const pixelx = x - subsprite.position.x;
			const pixely = y - subsprite.position.y;
			const tx = (pixelx / 8) | 0;
			const ty = (pixely / 8) | 0;
			const tileNum =
				subsprite.startTile +
				(filpY ? sizey - 1 - ty : ty) * sizex +
				(filpX ? sizex - 1 - tx : tx);
			if (tileNum >= tileset.length) {
				console.warn("Tile number overflowed!", tileNum, tileset.length);
			}
			const tile = tileset[tileNum];
			const px = (pixelx % 8) | 0;
			const py = (pixely % 8) | 0;
			const pixelIndex = (filpY ? 7 - py : py) * 8 + (filpX ? 7 - px : px);
			const pixel = tile[pixelIndex];
			if (!transparent || (transparent && pixel !== 0)) {
				return {
					tileId: tileNum,
					pixelIndex,
					pixelColorIndex: pixel,
					subspriteId: index,
				};
			}
		}
	}
	return null;
}

function getFlip(filpFlag: number) {
	return {
		h: (filpFlag & 0x1) === 1,
		v: (filpFlag & 0x2) === 1,
	};
}

/*
OBJ Attribute 0 (R/W)
  Bit   Expl.
  0-7   Y-Coordinate           (0-255)
  8     Rotation/Scaling Flag  (0=Off, 1=On)
  When Rotation/Scaling used (Attribute 0, bit 8 set):
    9     Double-Size Flag     (0=Normal, 1=Double)
  When Rotation/Scaling not used (Attribute 0, bit 8 cleared):
    9     OBJ Disable          (0=Normal, 1=Not displayed)
  10-11 OBJ Mode  (0=Normal, 1=Semi-Transparent, 2=OBJ Window, 3=Prohibited)
  12    OBJ Mosaic             (0=Off, 1=On)
  13    Colors/Palettes        (0=16/16, 1=256/1)
  14-15 OBJ Shape              (0=Square,1=Horizontal,2=Vertical,3=Prohibited)
Caution: A very large OBJ (of 128 pixels vertically, ie. a 64 pixels OBJ in a
Double Size area) located at Y>128 will be treated as at Y>-128, the OBJ is
then displayed parts offscreen at the TOP of the display, it is then NOT
displayed at the bottom.

OBJ Attribute 1 (R/W)
  Bit   Expl.
  0-8   X-Coordinate           (0-511)
  When Rotation/Scaling used (Attribute 0, bit 8 set):
    9-13  Rotation/Scaling Parameter Selection (0-31)
          (Selects one of the 32 Rotation/Scaling Parameters that
          can be defined in OAM, for details read next chapter.)
  When Rotation/Scaling not used (Attribute 0, bit 8 cleared):
    9-11  Not used
    12    Horizontal Flip      (0=Normal, 1=Mirrored)
    13    Vertical Flip        (0=Normal, 1=Mirrored)
  14-15 OBJ Size               (0..3, depends on OBJ Shape, see Attr 0)
*/

/**
 * @param {ImageData} result
 * @param {Uint8Array} tileData
 * @param {[number, number, number][]} palette
 */
function renderTile(result: ImageData, tileData: Uint8Array, palette: Color[]) {
	for (let i = 0; i < tileData.byteLength; i++) {
		const pixel = tileData[i];
		const [r, g, b] = palette[pixel];
		result[i * 4] = r;
		result[i * 4 + 1] = g;
		result[i * 4 + 2] = b;
		result[i * 4 + 3] = 0xff;
	}
}

export interface SubSprite {
	position: { x: number; y: number };
	objSize: number;
	objShape: number;
	flip: { h: boolean; v: boolean };
	isLastSpriteObject?: boolean;
	startTile: number;
	size: { x: number; y: number };
	prohibited: boolean;
}
export interface Sprite {
	subsprites: SubSprite[];
	tileSetID: number;
}
export interface AnimationFrame {
	spriteId: number;
	delay: number;
	isLoop: boolean;
	palette: number;
}

class SFSprite {
	_spriteCache: Map<number, any>;
	palettes: Color[][];
	colorMode: boolean;
	maxTiles: number;
	sprites: Sprite[];
	animations: AnimationFrame[][];
	tileSetMeta: any[];
	tilesets: Uint8Array[][];
	/**
	 *
	 * @param {import('./buffer').default} data
	 */
	constructor() {
		this._spriteCache = new Map();
		this.palettes = [];
		this.colorMode = false;
		this.maxTiles = 0;
		this.sprites = [];
		/**
		 * @typedef AnimationFrame
		 * @property {number} spriteId
		 * @property {number} delay
		 * @property {number} loopFlag
		 * @property {number} palette
		 */
		/**
		 * @type {AnimationFrame[][]}
		 */
		this.animations = [];
		this.tileSetMeta = [];
		/**
		 * @type {Uint8Array[][]}
		 */
		this.tilesets = [];
		// console.log(this)
	}

	/**
	 *
	 * @param {import("./buffer").BufferReader} data
	 */
	loadFromFileBuffer(data: import("./buffer").BufferReader) {
		this._spriteCache = new Map();

		// console.log('Reading SFSprite')
		if (data.byteLength < 4 * 5) {
			throw new HeaderTooSmallReadError(data.byteLength);
		}
		const tilesetHeader = data.readUint32();
		const paletteHeader = data.readUint32();
		const animationHeader = data.readUint32();
		const spriteHeader = data.readUint32();
		const startTileShift = data.readUint32(); // starting tile number shift, used by game, write 1 when saving back

		// console.log(data.byteLength, tilesetHeader, paletteHeader, animationHeader, spriteHeader, startTileShift)

		if (tilesetHeader > data.byteLength) {
			throw new TilesetsHeaderOverflowReadError(data.byteLength, tilesetHeader);
		}
		if (paletteHeader > data.byteLength) {
			throw new PalettesHeaderOverflowReadError(data.byteLength, paletteHeader);
		}
		if (animationHeader > data.byteLength) {
			throw new AnimationsHeaderOverflowReadError(
				data.byteLength,
				animationHeader,
			);
		}
		if (spriteHeader > data.byteLength) {
			throw new SpritesHeaderOverflowReadError(data.byteLength, spriteHeader);
		}

		// Palettes
		data.seek(paletteHeader);
		if (data.byteLength < tilesetHeader + 2 * 2) {
			throw new PalettesAddressOverflowReadError(
				data.byteLength,
				tilesetHeader + 2 * 2,
			);
		}
		const colorDepth = data.readUint16();
		const paletteCountMax = data.readUint16();
		// console.log('PaletteHeader', colorDepth, paletteHeader)
		if (colorDepth !== 5 && colorDepth !== 6) {
			throw new UnsupportedColorModeReadError(colorDepth);
		}
		const paletteSize = colorDepth === 5 ? 16 : colorDepth === 6 ? 256 : 0;
		const tileSize = colorDepth === 5 ? 0x20 : colorDepth === 6 ? 0x40 : 0;
		const tileNumberShift = colorDepth === 5 ? 1 : colorDepth === 6 ? 0 : 0;
		/**
		 * 256 Color Mode
		 * @type {boolean}
		 */
		this.colorMode = colorDepth === 6;
		// 5: palSize 16; tileSize 0x20; tnumShift 1; 256colormode = false
		// 6: palSize 256; tileSize 0x40; tnumShift 0; 256colormode = true

		let blockEnd = data.byteLength;
		if (tilesetHeader > paletteHeader && tilesetHeader < blockEnd) {
			blockEnd = tilesetHeader;
		}
		if (animationHeader > paletteHeader && animationHeader < blockEnd) {
			blockEnd = animationHeader;
		}
		if (spriteHeader > paletteHeader && spriteHeader < blockEnd) {
			blockEnd = spriteHeader;
		}
		this.palettes = [];
		for (let i = 0; data.tell() < blockEnd; i++) {
			const palette: Color[] = [];
			for (let j = 0; j < paletteSize; j++) {
				palette.push(data.readGBAColor());
			}
			this.palettes.push(palette);
		}

		// Sprites
		data.seek(spriteHeader);
		if (data.byteLength < spriteHeader + 2 * 2) {
			throw new SpritesAddressOverflowReadError(
				data.byteLength,
				tilesetHeader + 2 * 2,
			);
		}
		this.sprites = [];
		const totalSprites = data.readUint16();
		const _spriteUnused = data.readUint16();
		// console.log('共计', totalSprites, '个精灵')
		for (let i = 0; i < totalSprites; i++) {
			const offset = data.readUint32();
			const originalPosision = data.tell();
			data.seek(offset + spriteHeader);

			const subsprites = [];

			// subsprites
			while (true) {
				if (data.tell() >= data.byteLength) {
					throw new NoLastSubspriteMarkReadError(subsprites.length);
				}
				const startTile = (data.readUint8() << tileNumberShift) & 0xffff;
				const spriteObj: SubSprite = {
					position: {
						x: data.readInt8(),
						y: data.readInt8(),
					},
					size: {
						x: 0,
						y: 0,
					},
					prohibited: false,
					objSize: data.readUint8(),
					objShape: data.readUint8(),
					flip: getFlip(data.readUint8()),
					isLastSpriteObject: data.readUint8() !== 0,
					startTile:
						startTile + ((data.readUint8() << (8 + tileNumberShift)) & 0xffff),
				};
				spriteObj.size = getObjSize(spriteObj.objSize, spriteObj.objShape);
				spriteObj.prohibited = spriteObj.objShape === 3;
				subsprites.push(spriteObj);
				if (spriteObj.isLastSpriteObject) {
					delete spriteObj.isLastSpriteObject;
					break;
				}
				delete spriteObj.isLastSpriteObject;
			}

			this.sprites.push({
				subsprites,
				tileSetID: 0,
			});

			data.seek(originalPosision);
			// console.log(i, this.sprites[i])
		}

		// Tileset
		data.seek(tilesetHeader);
		if (data.byteLength < tilesetHeader + 2 * 4) {
			throw new TilesetsAddressOverflowReadError(
				data.byteLength,
				tilesetHeader + 2 * 4,
			);
		}
		this.maxTiles = data.readUint16();
		const totalTiles = data.readUint16();
		const tilesetHeaderSize = data.readUint16();
		const _tilesetUnused = data.readUint16();

		/** @type {Uint8Array[][]} */
		this.tileSetMeta = [];
		this.tilesets = [];
		// console.log('共计', totalSprites, '个图块集')
		for (let i = 0; i < totalSprites; i++) {
			if (data.byteLength < data.tell() + 4) {
				throw new TilesetsEOFReadError(i, data.byteLength, data.tell());
			}
			const tileCount = data.readUint16();
			const tileNum = data.readUint16();
			const dup = this.tileSetMeta.findIndex(
				(t) => t[1] === tileNum && t[0] === tileCount,
			);
			if (dup !== -1) {
				// Use existing ID
				this.sprites[i].tileSetID = dup;
			} else {
				// Create new ID
				this.sprites[i].tileSetID = this.tileSetMeta.length;
				this.tileSetMeta.push([tileCount, tileNum]);

				const curPos = data.tell();
				const tilesetPos =
					tilesetHeader + tilesetHeaderSize + tileNum * tileSize;
				if (data.byteLength < tilesetPos) {
					throw new TilesetsWrongPositionReadError(
						i,
						data.byteLength,
						tilesetPos,
					);
				}
				if (data.byteLength < tilesetPos + tileSize * tileCount) {
					throw new TilesetsWrongSizeReadError(
						i,
						data.byteLength,
						tilesetPos,
						tileSize * tileCount,
					);
				}
				// console.log('图块集', i, '共计', tileCount, '个图块', tileNum, tilesetHeader + tilesetHeaderSize + tileNum * tileSize)
				data.seek(tilesetPos);
				const tileset = [];
				for (let j = 0; j < tileCount; j++) {
					// console.log('Reading', tileSize)
					const tileBytes = data.readBytes(tileSize);
					// console.log('Read')
					if (this.colorMode) {
						tileset.push(tileBytes);
					} else {
						const gbaBytes = [];
						for (const byte of tileBytes) {
							gbaBytes.push(byte & 0xf);
							gbaBytes.push((byte >> 4) & 0xf);
						}
						tileset.push(new Uint8Array(gbaBytes));
					}
				}
				// console.log(tileset)
				this.tilesets.push(tileset);
				data.seek(curPos);
			}
		}

		// Animation
		data.seek(animationHeader);
		this.animations = [];
		const totalAnimations = data.readUint16();
		const _animationUnused = data.readUint16();
		// console.log('共计', totalAnimations, '个动画')
		for (let i = 0; i < totalAnimations; i++) {
			const animation = [];
			const animationOffset = data.readUint32();
			const curPos = data.tell();
			data.seek(animationOffset + animationHeader);
			while (true) {
				const animationFrame = {
					spriteId: data.readUint8(),
					delay: data.readUint8(),
					loopFlag: data.readUint8(),
					isLoop: false,
					palette: data.readUint8(),
				};
				animationFrame.isLoop = !!(animationFrame.loopFlag & 0x40);
				animation.push(animationFrame);
				if ((animationFrame.loopFlag & 0xc0) !== 0) {
					break;
				}
			}
			data.seek(curPos);
			this.animations.push(animation);
		}

		// 预先渲染一个动画帧
		this.renderAnimationFrame(0);
	}

	saveToBytes() {}

	getSpriteBound(index: number) {
		const s = this.sprites[index].subsprites;
		const result = { top: 0, bottom: 0, left: 0, right: 0 };
		for (const subsprite of s) {
			result.right = Math.max(
				result.right,
				subsprite.position.x + subsprite.size.x,
			);
			result.bottom = Math.max(
				result.bottom,
				subsprite.position.y + subsprite.size.y,
			);
			result.left = Math.min(result.left, subsprite.position.x);
			result.top = Math.min(result.top, subsprite.position.y);
		}
		return result;
	}

	getAnimationFrame(index: string | number, frameIndex = 0) {
		return this._spriteCache.get(this.animations[index][frameIndex].spriteId);
	}

	getAnimationFrameURL(index: number, frameIndex = 0) {
		const image = this.getAnimationFrame(index, frameIndex);
		if (!image) {
			this.renderAnimationFrame(index, frameIndex);
			const image = this.getAnimationFrame(index, frameIndex);
			const dataUrl = `data:image/png;base64,${btoa(image.toBytes("png"))}`;
			return dataUrl;
		}
		const dataUrl = `data:image/png;base64,${btoa(image.toBytes("png"))}`;
		return dataUrl;
	}

	renderAnimationFrame(index: number, frameIndex = 0) {
		const animationFrame = this.animations[index][frameIndex];
		// console.log(index, animationFrame)
		return this.renderSprite({
			index: animationFrame.spriteId,
			palettesIndex: animationFrame.palette,
		});
	}

	markSpriteDirtyFromAnimationFrame(
		index: string | number,
		frameIndex: string | number,
		sideAffect = true,
	) {
		const animationFrame = this.animations[index][frameIndex];
		this._spriteCache.delete(animationFrame.spriteId);
		if (sideAffect) {
			this.checkSpritesUsedTileSet(index).map((_v, i) => {
				this._spriteCache.delete(i);
			});
		}
	}

	checkSpritesUsedTileSet(tileSetId: string | number) {
		return this.sprites.filter((v) => v.tileSetID === tileSetId);
	}

	markAllSpritesDirty() {
		this._spriteCache.clear();
	}

	markSpriteDirty(index: number) {
		this._spriteCache.delete(index);
	}

	getSpriteImage(index: number) {
		return this._spriteCache.get(index);
	}

	getSpriteImageURL(index: number, palettesIndex = 0, transparent = true) {
		const image = this.renderSprite({
			index,
			palettesIndex,
			transparent,
		});
		const dataUrl = `data:image/png;base64,${btoa(image.toBytes("png"))}`;
		return dataUrl;
	}

	hitTest(
		animationIndex: string | number,
		animationFrame: string | number,
		positionX: number,
		positionY: number,
		ignoreTransparent = true,
	) {
		const animation = this.animations[animationIndex][animationFrame];
		const sprite = this.sprites[animation.spriteId];
		for (let i = sprite.subsprites.length - 1; i >= 0; i--) {
			const subsprite = sprite.subsprites[i];
			if (
				positionX >= subsprite.position.x &&
				positionY >= subsprite.position.y &&
				positionX < subsprite.position.x + subsprite.size.x &&
				positionY < subsprite.position.y + subsprite.size.y
			) {
				const sizex = subsprite.size.x / 8;
				const sizey = subsprite.size.y / 8;
				const mx = positionX - subsprite.position.x;
				const my = positionY - subsprite.position.y;
				const tx = (mx / 8) | 0;
				const ty = (my / 8) | 0;
				const px = (mx % 8) | 0;
				const py = (my % 8) | 0;
				const filpX = subsprite.flip.h;
				const filpY = subsprite.flip.v;
				const tileNum =
					subsprite.startTile +
					(filpY ? sizey - 1 - ty : ty) * sizex +
					(filpX ? sizex - 1 - tx : tx);
				if (
					ignoreTransparent &&
					tileNum >= this.tilesets[sprite.tileSetID].length
				) {
					continue;
				}
				const tile = this.tilesets[sprite.tileSetID][tileNum];
				const pixelPos =
					((filpY ? 7 - py : py) * 8 + (filpX ? 7 - px : px)) | 0;
				const pixel = tile[pixelPos];
				if (pixel !== 0 || !ignoreTransparent) {
					return {
						id: i,
						tileSetId: sprite.tileSetID,
						tile,
						tileNum,
						pixel,
						pixelPos,
						subsprite,
					};
				}
			}
		}
		return null;
	}

	renderSpriteEx({
		index,
		palettesIndex = 0,
		transparent = true,
		blacklist = new Set(),
		putPixelCallback = null,
	}) {
		const sprite = this.sprites[index];
		const tilesets = this.tilesets;
		const palette = this.palettes[palettesIndex];
		// a data url with png data
		{
			let index = 0;
			for (const subsprite of sprite.subsprites) {
				if (subsprite.prohibited || blacklist.has(index++)) {
					continue;
				}
				const sizey = subsprite.size.y / 8;
				const sizex = subsprite.size.x / 8;
				const filpX = subsprite.flip.h;
				const filpY = subsprite.flip.v;
				for (let ty = 0; ty < sizey; ty++) {
					for (let tx = 0; tx < sizex; tx++) {
						const tileNum =
							subsprite.startTile +
							(filpY ? sizey - 1 - ty : ty) * sizex +
							(filpX ? sizex - 1 - tx : tx);
						if (tileNum >= tilesets[sprite.tileSetID].length) {
							continue;
						}
						const tile = tilesets[sprite.tileSetID][tileNum];

						for (let py = 0; py < 8; py++) {
							for (let px = 0; px < 8; px++) {
								const pixel =
									tile[(filpY ? 7 - py : py) * 8 + (filpX ? 7 - px : px)];
								if (transparent && pixel === 0) {
									continue;
								}
								const c = palette[pixel];

								if (putPixelCallback) {
									putPixelCallback(
										subsprite.position.x + tx * 8 + px,
										subsprite.position.y + ty * 8 + py,
										c,
									);
								}
							}
						}
					}
				}
			}
		}
	}

	renderSprite(options: {
		index: any;
		palettesIndex?: any;
		transparent?: any;
		blacklist?: any;
		putPixelCallback?: any;
	}) {
		/*
        index, palettesIndex = 0, transparent = true
        */
		if (this._spriteCache.has(options.index)) {
			return this._spriteCache.get(options.index);
		}
		const image = this.renderSpriteEx(options);
		this._spriteCache.set(options.index, image);
		return image;
	}
}

export { SFSprite };
