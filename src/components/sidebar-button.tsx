import { Button, Classes } from "@blueprintjs/core";
import styles from "./sidebar-button.module.css";

export function SidebarButton({ children, ...props }) {
	return (
		<Button className={Classes.LARGE} {...props}>
			{children}
		</Button>
	);
}
