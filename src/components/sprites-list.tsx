import { useMemo } from "react/hooks";
import { useDispatch, useSelector } from "react-redux";
import { MainStore } from "../reducers";
import { getSprite } from "../reducers/sprite";
import { FunctionComponent, JSX } from "react";
import { getSpriteBound, renderSprite } from "../utils/sfsprite";
import { Color } from "../utils/color";
import styles from "./sprites-list.module.css";
import {
	getPreviewPalette,
	isViewingAndSameId,
	switchToSprite,
} from "../reducers/editing";
import classname from "../utils/classname";
import { FormattedMessage } from "react-intl";
import { setTab } from "../reducers/tab";

export const SpriteListItem: FunctionComponent<{ index: number }> = (props) => {
	const dispatch = useDispatch();
	const sprite = useSelector(getSprite);
	const thisSprite = useSelector(
		(state: MainStore) => sprite.sprites[props.index],
	);
	const tileset = useSelector(
		(state: MainStore) => sprite.tilesets[thisSprite.tileSetID],
	);
	const previewPalette = useSelector(getPreviewPalette);
	const palette = useSelector(
		(state: MainStore) => sprite.palettes[previewPalette] || sprite.palettes[0],
	);
	const isSelected = useSelector((state: MainStore) =>
		isViewingAndSameId(state, "sprite", props.index),
	);
	const preview = useMemo(() => {
		if (thisSprite) {
			const canvas = document.createElement("canvas");
			const bounding = getSpriteBound(thisSprite.subsprites);
			canvas.width = bounding.right - bounding.left;
			canvas.height = bounding.bottom - bounding.top;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				const imgData = ctx.createImageData(canvas.width, canvas.height);
				renderSprite({
					sprite: thisSprite,
					tileset,
					palette,
					putPixelCallback: (x: number, y: number, color: Color) => {
						imgData.data[
							((y - bounding.top) * imgData.width + x - bounding.left) * 4 + 0
						] = color[0];
						imgData.data[
							((y - bounding.top) * imgData.width + x - bounding.left) * 4 + 1
						] = color[1];
						imgData.data[
							((y - bounding.top) * imgData.width + x - bounding.left) * 4 + 2
						] = color[2];
						imgData.data[
							((y - bounding.top) * imgData.width + x - bounding.left) * 4 + 3
						] = 255;
					},
				});
				ctx.putImageData(imgData, 0, 0);
				return canvas.toDataURL();
			}
		}
		return null;
	}, [thisSprite, tileset, palette]);
	return (
		<div className={styles.spriteButton}>
			<button
				className={classname(isSelected && styles.selected)}
				onClick={() => dispatch(switchToSprite(props.index))}
				onDblClick={() => dispatch(setTab("edit"))}
			>
				{preview ? <img src={preview} /> : null}
			</button>
			<button
				className={classname(isSelected && styles.selected)}
				onClick={() => dispatch(switchToSprite(props.index))}
			>
				<FormattedMessage id='sprite-item.delete' defaultMessage='Delete' />
			</button>
		</div>
	);
};

export const SpriteList: FunctionComponent<{
	display?: string;
	className?: string;
	style?: JSX.CSSProperties;
}> = (props) => {
	const {
		display = "inline-block",
		className = "",
		style = {},
		...otherProps
	} = props;
	const sprites = useSelector((state: MainStore) => getSprite(state).sprites);
	return (
		<div
			className={classname(styles.spriteList, className)}
			style={{ display, ...style }}
			{...otherProps}
		>
			{sprites.map((sprite, index) => (
				<SpriteListItem key={index} index={index} />
			))}
		</div>
	);
};
