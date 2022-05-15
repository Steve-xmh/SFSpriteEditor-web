import { FunctionComponent } from 'preact'
import { useDispatch, useSelector } from 'react-redux'
import { MainStore } from '../reducers'
import { closeDialog, getDialog } from '../reducers/dialogs'
import classname from '../utils/classname'
import styles from './dialog.module.css'

export const Dialog: FunctionComponent<{
    title?: string
    closable?: boolean
    dialogId: string
}> = props => {
    const dispatch = useDispatch()
    const opened = useSelector((store: MainStore) => getDialog(store, props.dialogId))
    return <div onClick={() => props.closable && dispatch(closeDialog(props.dialogId))} className={classname(styles.fullscreen, opened && styles.opened)}>
        <div onClick={evt => evt.stopPropagation()} className={styles.dialog}>
            <div className={styles.header}>
                {props.title}
            </div>
            <div>
                {props.children}
            </div>
        </div>
    </div>
}
