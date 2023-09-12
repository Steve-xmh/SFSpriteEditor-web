import { FunctionComponent, useEffect, useMemo, useState } from "react";
import { MainStore } from "../reducers";
import {
	switchAnimation,
	switchAnimationFrame,
	switchPreviewPalette,
	switchToSprite,
} from "../reducers/editing";
import { getSprite, setSprite } from "../reducers/sprite";
import { setTab } from "../reducers/tab";
import classname from "../utils/classname";
import { Color } from "../utils/color";
import {
	AnimationFrame,
	getSpriteBound,
	renderSprite,
} from "../utils/sfsprite";
import styles from "./animations-page.module.css";

export const AnimationsPage: FunctionComponent = () => {
	const dispatch = useDispatch();
	const sprite = useSelector(getSprite);
	const editing = useSelector((state: MainStore) => state.editing);
	const palette = useSelector(
		(state: MainStore) => getSprite(state).palettes[0],
	);
	const animations = sprite.animations || [];
	const [hoveringAnimation, setHoveringAnimation] = useState(null);
	const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
	const previews = useMemo(() => {
		const canvas = document.createElement("canvas");
		return animations.map((animation) => {
			if (animation.length === 0) {
				return [];
			}
			const bounding = animation
				.map((frame) =>
					getSpriteBound(sprite.sprites[frame.spriteId].subsprites),
				)
				.reduce((a, b) => {
					return {
						left: Math.min(a.left, b.left),
						top: Math.min(a.top, b.top),
						right: Math.max(a.right, b.right),
						bottom: Math.max(a.bottom, b.bottom),
					};
				});
			return animation.map((frame) => {
				const palette = frame.palette;
				const spriteId = frame.spriteId;
				if (sprite.sprites[spriteId] && sprite.palettes[palette]) {
					const frameSprite = sprite.sprites[spriteId];
					canvas.width = bounding.right - bounding.left;
					canvas.height = bounding.bottom - bounding.top;
					const ctx = canvas.getContext("2d");
					if (ctx) {
						const imgData = ctx.createImageData(canvas.width, canvas.height);
						renderSprite({
							sprite: frameSprite,
							tileset: sprite.tilesets[frameSprite.tileSetID],
							palette: sprite.palettes[palette],
							putPixelCallback: (px: number, py: number, color: Color) => {
								const x = px - bounding.left;
								const y = py - bounding.top;
								imgData.data[(y * imgData.width + x) * 4 + 0] = color[0];
								imgData.data[(y * imgData.width + x) * 4 + 1] = color[1];
								imgData.data[(y * imgData.width + x) * 4 + 2] = color[2];
								imgData.data[(y * imgData.width + x) * 4 + 3] = 255;
							},
						});
						ctx.putImageData(imgData, 0, 0);
						return {
							preview: canvas.toDataURL(),
							delay: frame.isLoop ? ((frame.delay / 60) * 1000) | 0 : 5000,
						};
					}
					return null;
				}
				return null;
			});
		});
	}, [sprite, palette]);
	useEffect(() => {
		if (hoveringAnimation !== null) {
			let aniId: number;
			let last: number = 0;
			let frameIndex = 0;
			let frameTimer = 0;
			const f = (time: number) => {
				const delta = time - last;
				last = time;
				const animation = sprite.animations[hoveringAnimation];
				if (animation.length > 0) {
					const currentFrame = animation[frameIndex];
					if (currentFrame) {
						frameTimer += delta;
						// console.log(delta, frameTimer, currentFrame.delay / 60 * 1000, frameIndex)
						if (frameTimer >= (currentFrame.delay / 60) * 1000) {
							const nextFrame = currentFrame.isLoop
								? 0
								: (frameIndex + 1) % animation.length;
							setCurrentFrameIndex(() => nextFrame);
							frameIndex = nextFrame;
							frameTimer = 0;
						}
					}
				}
				aniId = requestAnimationFrame(f);
			};
			aniId = requestAnimationFrame(f);
			return () => cancelAnimationFrame(aniId);
		}
	}, [hoveringAnimation]);
	function onMouseEnter(evt: MouseEvent) {
		setHoveringAnimation(
			Number((evt.currentTarget as HTMLButtonElement).dataset.index),
		);
	}
	function onMouseLeave(evt: MouseEvent) {
		setHoveringAnimation(null);
	}
	function getCurrentAnimationFrameSpriteId() {
		const animation = sprite.animations[editing.selectedAnimationId] || [];
		const currentFrame = animation[editing.selectedAnimationFrame] || {
			spriteId: 0,
			palette: 0,
		};
		return currentFrame.spriteId;
	}
	function getCurrentAnimationFramePaletteId() {
		const animation = sprite.animations[editing.selectedAnimationId] || [];
		const currentFrame = animation[editing.selectedAnimationFrame] || {
			spriteId: 0,
			palette: 0,
		};
		return currentFrame.palette;
	}
	function getCurrentAnimationFrameLoop() {
		const animation = sprite.animations[editing.selectedAnimationId] || [];
		const currentFrame = animation[editing.selectedAnimationFrame] || {
			isLoop: false,
		};
		return currentFrame.isLoop;
	}
	function getCurrentAnimationFrameDelay() {
		const animation = sprite.animations[editing.selectedAnimationId] || [];
		const currentFrame = animation[editing.selectedAnimationFrame] || {
			delay: 0,
		};
		return currentFrame.delay;
	}
	function setAnimationFrame(
		animationId: number,
		frame: number,
		props: Partial<AnimationFrame>,
	) {
		if (
			animationId in sprite.animations &&
			frame in sprite.animations[animationId]
		) {
			const newAnimations = sprite.animations.slice();
			const animation = newAnimations[animationId];
			const newAnimation = animation.slice();
			if (Number.isSafeInteger(frame) && frame < animation.length) {
				newAnimation[frame] = {
					...animation[frame],
					...props,
				};
				newAnimations[animationId] = newAnimation;
				dispatch(
					setSprite({
						animations: newAnimations,
					}),
				);
			}
		}
	}
	function onInputSpriteId(evt: JSX.TargetedEvent<HTMLInputElement>) {
		const value = parseInt(evt.currentTarget.value, 10);
		setAnimationFrame(
			editing.selectedAnimationId,
			editing.selectedAnimationFrame,
			{ spriteId: isNaN(value) ? 0 : value },
		);
	}
	function onInputPaletteId(evt: JSX.TargetedEvent<HTMLInputElement>) {
		const value = parseInt(evt.currentTarget.value, 10);
		setAnimationFrame(
			editing.selectedAnimationId,
			editing.selectedAnimationFrame,
			{ palette: isNaN(value) ? 0 : value },
		);
	}
	function onInputLoop(evt: JSX.TargetedEvent<HTMLInputElement>) {
		setAnimationFrame(
			editing.selectedAnimationId,
			editing.selectedAnimationFrame,
			{ isLoop: evt.currentTarget.checked },
		);
	}
	function onInputDelay(evt: JSX.TargetedEvent<HTMLInputElement>) {
		const value = parseInt((evt.currentTarget as HTMLInputElement).value, 10);
		setAnimationFrame(
			editing.selectedAnimationId,
			editing.selectedAnimationFrame,
			{ delay: isNaN(value) ? 0 : value },
		);
	}
	function onNewAnimation(evt: JSX.TargetedMouseEvent<HTMLButtonElement>) {
		const newAnimations = sprite.animations.slice();
		newAnimations.push([]);
		dispatch(
			setSprite({
				animations: newAnimations,
			}),
		);
		dispatch(switchAnimation(newAnimations.length - 1));
	}
	function onNewAnimationFrame(evt: JSX.TargetedMouseEvent<HTMLButtonElement>) {
		const newAnimations = sprite.animations.slice();
		const animation = newAnimations[editing.selectedAnimationId];
		animation.push({
			spriteId: 0,
			palette: 0,
			isLoop: false,
			delay: 0,
		});
		dispatch(
			setSprite({
				animations: newAnimations,
			}),
		);
		dispatch(switchAnimationFrame(animation.length - 1));
	}
	function onDeleteAnimationFrame(
		evt: JSX.TargetedMouseEvent<HTMLButtonElement>,
	) {
		const newAnimations = sprite.animations.slice();
		const animation = newAnimations[editing.selectedAnimationId];
		animation.splice(editing.selectedAnimationFrame, 1);
		dispatch(
			setSprite({
				animations: newAnimations,
			}),
		);
		dispatch(
			switchAnimationFrame(Math.max(0, editing.selectedAnimationFrame - 1)),
		);
	}
	function onDeleteAnimation(evt: JSX.TargetedMouseEvent<HTMLButtonElement>) {
		const newAnimations = sprite.animations.slice();
		newAnimations.splice(editing.selectedAnimationId, 1);
		dispatch(
			setSprite({
				animations: newAnimations,
			}),
		);
		dispatch(switchAnimation(Math.max(0, editing.selectedAnimationId - 1)));
	}
	function onMoveUpAnimationFrame(
		evt: JSX.TargetedMouseEvent<HTMLButtonElement>,
	) {
		const newAnimations = sprite.animations.slice();
		const animation = newAnimations[editing.selectedAnimationId];
		const frame = animation[editing.selectedAnimationFrame];
		const newFrame = animation[editing.selectedAnimationFrame - 1];
		animation[editing.selectedAnimationFrame] = newFrame;
		animation[editing.selectedAnimationFrame - 1] = frame;
		dispatch(
			setSprite({
				animations: newAnimations,
			}),
		);
		dispatch(switchAnimationFrame(editing.selectedAnimationFrame - 1));
	}
	function onMoveDownAnimationFrame(
		evt: JSX.TargetedMouseEvent<HTMLButtonElement>,
	) {
		const newAnimations = sprite.animations.slice();
		const animation = newAnimations[editing.selectedAnimationId];
		const frame = animation[editing.selectedAnimationFrame];
		const newFrame = animation[editing.selectedAnimationFrame + 1];
		animation[editing.selectedAnimationFrame] = newFrame;
		animation[editing.selectedAnimationFrame + 1] = frame;
		dispatch(
			setSprite({
				animations: newAnimations,
			}),
		);
		dispatch(switchAnimationFrame(editing.selectedAnimationFrame + 1));
	}
	return (
		<div className={styles.animationsPage}>
			<div className={styles.animationsList}>
				{animations.map((animation, index) => (
					<button
						data-index={index}
						key={index}
						className={classname(
							styles.animationsButton,
							editing.selectedAnimationId === index && styles.selected,
						)}
						onClick={() => {
							dispatch(switchAnimation(index));
							if (animation.length > 0) {
								dispatch(switchPreviewPalette(animation[0].palette));
								dispatch(switchToSprite(animation[0].spriteId));
								dispatch(switchAnimationFrame(0));
							}
						}}
						onDblClick={() => {
							dispatch(setTab("edit"));
						}}
						onMouseEnter={onMouseEnter}
						onMouseMove={onMouseEnter}
						onMouseLeave={onMouseLeave}
					>
						<span>{index}</span>
						<img
							src={
								previews[index][
									hoveringAnimation === index ? currentFrameIndex : 0
								]?.preview ||
								previews[index][0]?.preview ||
								""
							}
						/>
					</button>
				))}
			</div>
			<div className={styles.animationDetail}>
				<div className={styles.frameOptions}>
					<div className={styles.buttonsPane}>
						<button onClick={onNewAnimation}>
							<FormattedMessage
								id='animations.new-animation'
								defaultMessage='New Animation'
							/>
						</button>
						<button
							onClick={onDeleteAnimation}
							disabled={!(editing.selectedAnimationId in sprite.animations)}
						>
							<FormattedMessage
								id='animations.delete-selected-animation'
								defaultMessage='Delete Selected Animation'
							/>
						</button>
						<button
							onClick={onNewAnimationFrame}
							disabled={!(editing.selectedAnimationId in sprite.animations)}
						>
							<FormattedMessage
								id='animations.new-animation-frame'
								defaultMessage='New Frame'
							/>
						</button>
						<button
							onClick={onDeleteAnimationFrame}
							disabled={
								!(editing.selectedAnimationId in sprite.animations) ||
								!(
									editing.selectedAnimationFrame in
									sprite.animations[editing.selectedAnimationId]
								)
							}
						>
							<FormattedMessage
								id='animations.delect-selected-animation-frame'
								defaultMessage='Delete Selected Frame'
							/>
						</button>
						<button
							onClick={onMoveUpAnimationFrame}
							disabled={
								!(editing.selectedAnimationId in sprite.animations) ||
								!(
									editing.selectedAnimationFrame in
									sprite.animations[editing.selectedAnimationId]
								) ||
								editing.selectedAnimationFrame === 0
							}
						>
							<FormattedMessage
								id='animations.move-up-selected-animation-frame'
								defaultMessage='Move Up Frame'
							/>
						</button>
						<button
							onClick={onMoveDownAnimationFrame}
							disabled={
								!(editing.selectedAnimationId in sprite.animations) ||
								!(
									editing.selectedAnimationFrame in
									sprite.animations[editing.selectedAnimationId]
								) ||
								editing.selectedAnimationFrame ===
									sprite.animations[editing.selectedAnimationId].length - 1
							}
						>
							<FormattedMessage
								id='animations.move-down-selected-animation-frame'
								defaultMessage='Move Down Frame'
							/>
						</button>
					</div>
					<div>
						<b>
							<FormattedMessage
								id='animations.frame-config'
								defaultMessage='Frame Config'
							/>
						</b>
					</div>
					<div className={styles.frameConfig}>
						<label>
							<FormattedMessage id='animations.loop' defaultMessage='Loop' />
						</label>
						<input
							type="checkbox"
							onClick={onInputLoop}
							checked={getCurrentAnimationFrameLoop()}
						></input>
						<label>
							<FormattedMessage
								id='animations.sprite-id'
								defaultMessage='Sprite ID'
							/>
						</label>
						<input
							type="number"
							min="0"
							max={sprite.sprites.length - 1}
							onInput={onInputSpriteId}
							value={getCurrentAnimationFrameSpriteId()}
						></input>
						<label>
							<FormattedMessage
								id='animations.palette-id'
								defaultMessage='Palette ID'
							/>
						</label>
						<input
							type="number"
							min="0"
							max={sprite.palettes.length - 1}
							onInput={onInputPaletteId}
							value={getCurrentAnimationFramePaletteId()}
						></input>
						<label>
							<FormattedMessage id='animations.delay' defaultMessage='Delay' />
						</label>
						<input
							type="number"
							min="0"
							max="255"
							onInput={onInputDelay}
							value={getCurrentAnimationFrameDelay()}
						></input>
					</div>
				</div>
				<div className={styles.animationFrameList}>
					{animations[editing.selectedAnimationId] &&
						animations[editing.selectedAnimationId].map((frame, index) => (
							<button
								data-index={index}
								key={index}
								className={classname(
									styles.animationsButton,
									editing.selectedAnimationFrame === index && styles.selected,
								)}
								onClick={() => {
									dispatch(switchPreviewPalette(frame.palette));
									dispatch(switchToSprite(frame.spriteId));
									dispatch(switchAnimationFrame(index));
								}}
								onDblClick={() => {
									dispatch(setTab("edit"));
								}}
							>
								<span>{index}</span>
								<img
									src={previews[editing.selectedAnimationId][index].preview}
								/>
							</button>
						))}
				</div>
			</div>
		</div>
	);
};
