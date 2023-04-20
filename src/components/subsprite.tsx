import { FunctionComponent } from "react";
import { useMemo } from "react";
import { getSprite } from "../reducers/sprite";
import { renderSubSprite } from "../utils/sfsprite";

export const SubSprite: FunctionComponent<{
	spriteId: number;
	subspriteId: number;
	paletteId: number;
	transparent?: boolean;
}> = (props) => {
	const { spriteId, subspriteId, paletteId, transparent, ...otherProps } =
		props;
	const sprite = useSelector(getSprite);
	const thisSprite = sprite.sprites[spriteId];
	const subsprite = thisSprite.subsprites[subspriteId];
	const tileset = sprite.tilesets[thisSprite.tileSetID];
	const palette = sprite.palettes[paletteId];
	const preview = useMemo(() => {
		if (thisSprite) {
			const canvas = document.createElement("canvas");
			canvas.width = subsprite.size.x;
			canvas.height = subsprite.size.y;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				const imgData = ctx.createImageData(canvas.width, canvas.height);
				renderSubSprite({
					subsprite,
					tileset,
					transparent,
					putPixelCallback(x, y, pixel) {
						const color = palette[pixel];
						imgData.data[(y * imgData.width + x) * 4 + 0] = color[0];
						imgData.data[(y * imgData.width + x) * 4 + 1] = color[1];
						imgData.data[(y * imgData.width + x) * 4 + 2] = color[2];
						imgData.data[(y * imgData.width + x) * 4 + 3] = 255;
					},
				});
				ctx.putImageData(imgData, 0, 0);
				return canvas.toDataURL();
			}
		}
		return null;
	}, [thisSprite, tileset, palette]);
	return <img src={preview} {...otherProps} />;
};
