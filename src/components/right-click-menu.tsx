import { FunctionComponent, JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import styles from './right-click-menu.module.css'

export const RightClickMenu: FunctionComponent<{
    onClose: (value: any) => void,
}> = props => {
    const posX = useState(0)
    const posY = useState(0)
    const onClickOutside = (evt: JSX.TargetedMouseEvent<HTMLElement>) => {
        if ('value' in evt.currentTarget.dataset) {
            props.onClose(evt.currentTarget.dataset.value)
        } else {
            props.onClose(null)
        }
    }
    useEffect(() => {
        document.addEventListener('click', onClickOutside)
        return () => {
            document.removeEventListener('click', onClickOutside)
        }
    }, [])
    return <div style={{ left: `${posX}px`, right: `${posY}px` }} className={styles.rightClickMenu}>
        {props.children}
    </div>
}
