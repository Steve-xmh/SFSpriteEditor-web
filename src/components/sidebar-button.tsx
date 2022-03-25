import styles from './sidebar-button.module.css'

export function SidebarButton({ children, ...props}) {
    return <button className={styles.sidebarButton} {...props}>
        {children}
    </button>
}