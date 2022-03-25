import { FunctionComponent } from 'preact';
import { useDispatch, useSelector } from 'react-redux';
import { closeDialog } from '../reducers/dialogs';
import { switchPreviewPalette } from '../reducers/editing';
import { getSprite } from '../reducers/sprite';
import { Dialog } from './dialog';
import styles from './switch-palettes-dialog.module.css';

export const SwitchPalettesDialog: FunctionComponent<{
    dialogId?: string,
    onSelectedPalette?: (paletteIndex: number) => void;
}> = props => {
    const dispatch = useDispatch()
    const sprite = useSelector(getSprite)
    
    return <Dialog dialogId={props.dialogId || 'switchPalette'}>
        {
            sprite.palettes.map((palette, i) =>
                <button
                    key={i}
                    className={styles.palette}
                    onClick={() => {
                        if (props.onSelectedPalette) {
                            props.onSelectedPalette(i)
                        }
                        dispatch(closeDialog(props.dialogId || 'switchPalette'))
                    }}
                >
                    <div className={styles.paletteId}>{i}</div>
                    {palette.map((color, j) =>
                        <div
                            key={j}
                            className={styles.color}
                            style={{
                                backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                            }}
                        />
                    )}
                </button>
            )
        }
    </Dialog>
}
