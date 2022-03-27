import { FunctionComponent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { FormattedMessage, useIntl } from "react-intl";
import { useDispatch, useSelector } from "react-redux";
import { MainStore } from "../reducers";
import { openDialog } from "../reducers/dialogs";
import { getCurrentTool, getHiddenSubsprites, getId, getPreviewPalette, getTextToolText, getViewType, isPreviewTransparent, isSubspriteVisible, setTextToolText, switchColorIndex, switchTool, toggleHiddenSubsprite, togglePreviewTransparent, Tools } from "../reducers/editing";
import { getSprite } from "../reducers/sprite";
import classname from "../utils/classname";
import { Color } from "../utils/color";
import { Sprite } from "../utils/sfsprite";
import TextCanvas from "../utils/text-canvas";
import styles from "./edit-page.module.css";
import { SubSprite } from "./subsprite";
import { SwitchPalettesDialogButton } from "./switch-palettes-dialog";

export const PaletteColorSwitcher: FunctionComponent = props => {
    // const viewType = useSelector<MainStore, string>(state => state.editing.viewType);
    // const viewId = useSelector<MainStore, number>(state => state.editing.id);
    // const currentPalette = useSelector<MainStore, Color[]>(state => getSprite(state).palettes[0])
    const colorIndex = useSelector<MainStore, number>(state => state.editing.usingColorIndex);
    const sprite = useSelector(getSprite)
    const previewPalette = useSelector(getPreviewPalette)
    const palette = sprite.palettes[previewPalette] || sprite.palettes[0];
    const dispatch = useDispatch();
    return <div className={styles.paletteColorSwitcher}>
        <div className={styles.palette}>
            {
                palette &&
                palette.map(
                    (color, i) =>
                        <div
                            key={i}
                            className={classname(
                                styles.color,
                                colorIndex === i && styles.selected
                            )}
                            onClick={() => dispatch(switchColorIndex(i))}
                            style={{
                                backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                            }}
                        />
                )
            }
        </div>
        <SwitchPalettesDialogButton />
    </div>
}

export const ToolButton: FunctionComponent<{
    tool: Tools,
    shortcut: string,
}> = ({ tool, shortcut, children }) => {
    const dispatch = useDispatch();
    const currentTool = useSelector(getCurrentTool);
    const isActive = currentTool === tool;
    return (
        <button
            className={classname(styles.toolButton, isActive && styles.active)}
            onClick={() => dispatch(switchTool(tool))}
        >
            {children}
            <div className={styles.shortcut}>{shortcut}</div>
        </button>
    );
}

export const EditPage: FunctionComponent = () => {
    const dispatch = useDispatch()
    const sprite = useSelector(getSprite)
    const viewType = useSelector(getViewType)
    const currentId = useSelector(getId)
    const previewPalette = useSelector(getPreviewPalette)
    const usingTool = useSelector(getCurrentTool)
    const hiddenSubsprites = useSelector(getHiddenSubsprites)
    const previewTransparent = useSelector(isPreviewTransparent)
    const textToolText = useSelector(getTextToolText)
    const textareaRef = useRef<HTMLInputElement>()
    useEffect(() => {
        function onShortcutKeyPress(evt: KeyboardEvent) {
            if (evt.ctrlKey) return
            if (evt.altKey) return
            if (evt.shiftKey) return
            if (evt.metaKey) return
            if ((evt.target as any).nodeName.toLowerCase() === 'input') return
            if ((evt.target as any).nodeName.toLowerCase() === 'textarea') return
            switch (evt.code) {
                case 'KeyC':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.Cursor))
                case 'KeyW':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.Pencil))
                case 'KeyE':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.Eraser))
                case 'KeyV':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.ColorPicker))
                case 'KeyD':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.Line))
                case 'KeyA':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.Rectangle))
                case 'KeyS':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.FilledRectangle))
                case 'KeyQ':
                    evt.preventDefault()
                    // TODO: Quick pick color
                    return dispatch(switchTool(Tools.ColorPicker))
                case 'KeyF':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.Fill))
                case 'KeyT':
                    evt.preventDefault()
                    return dispatch(switchTool(Tools.Text))
                default:
            }
        }
        window.addEventListener('keypress', onShortcutKeyPress)
        return () => {
            window.removeEventListener('keypress', onShortcutKeyPress)
        }
    }, [])
    return <div className={styles.editPage}>
        <div className={styles.toolbar}>
            <ToolButton tool={Tools.Cursor} shortcut='C'>
                <FormattedMessage id="edit.tool.cursor" defaultMessage='Cursor' />
            </ToolButton>
            <ToolButton tool={Tools.Pencil} shortcut='W'>
                <FormattedMessage id="edit.tool.pencil" defaultMessage='Pencil' />
            </ToolButton>
            <ToolButton tool={Tools.Line} shortcut='D'>
                <FormattedMessage id="edit.tool.line" defaultMessage='Line' />
            </ToolButton>
            <ToolButton tool={Tools.Rectangle} shortcut='A'>
                <FormattedMessage id="edit.tool.rectangle" defaultMessage='Rectangle' />
            </ToolButton>
            <ToolButton tool={Tools.FilledRectangle} shortcut='S'>
                <FormattedMessage id="edit.tool.filled-rectangle" defaultMessage='Filled Rectangle' />
            </ToolButton>
            <ToolButton tool={Tools.Eraser} shortcut='E'>
                <FormattedMessage id="edit.tool.eraser" defaultMessage='Eraser' />
            </ToolButton>
            <ToolButton tool={Tools.ColorPicker} shortcut='V'>
                <FormattedMessage id="edit.tool.color-picker" defaultMessage='Color Picker' />
            </ToolButton>
            <ToolButton tool={Tools.Fill} shortcut='F'>
                <FormattedMessage id="edit.tool.fill" defaultMessage='Fill' />
            </ToolButton>
            <ToolButton tool={Tools.Text} shortcut='T'>
                <FormattedMessage id="edit.tool.text" defaultMessage='Text' />
            </ToolButton>
            <ToolButton tool={Tools.MoveSubsprite} shortcut='M'>
                <FormattedMessage id="edit.tool.move-subsprite" defaultMessage='Move Subsprite' />
            </ToolButton>
        </div>
        <PaletteColorSwitcher />
        <div className={styles.options}>
        {
            usingTool === Tools.Text &&
            <>
                <label><FormattedMessage id="edit.editing.text" defaultMessage='Text' /></label>
                <input ref={textareaRef} value={textToolText} onInput={evt => dispatch(setTextToolText(evt.currentTarget.value))}></input>
            </>
        }
            <label><FormattedMessage id="edit.show-zero-index-color" defaultMessage='Show zero index color' /></label>
            <input type='checkbox' onClick={() => dispatch(togglePreviewTransparent())} checked={previewTransparent}></input>
        </div>
        {
            viewType === 'sprite' &&
            <div className={styles.subspriteList}>
                {
                    (currentId in sprite.sprites) &&
                    sprite.sprites[currentId].subsprites.map(
                        (subsprite, i) => <div
                            key={i}
                            className={classname(
                                styles.subsprite
                            )}
                        >
                            {i}
                            <SubSprite transparent={false} spriteId={currentId} subspriteId={i} paletteId={previewPalette} />
                            <input type='checkbox' onClick={() => dispatch(toggleHiddenSubsprite(i))} checked={!hiddenSubsprites.has(i)}></input>
                        </div>
                    )
                }
            </div>
        }
    </div>;
};
