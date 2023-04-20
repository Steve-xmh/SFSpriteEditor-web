import styles from "./app.module.css";
import { useEffect } from "react";
import { Icon } from "@iconify/react";
import paletteSwatchVariant from "@iconify/icons-mdi/palette-swatch-variant";
import cubeUnfolded from "@iconify/icons-mdi/cube-unfolded";
import pencilIcon from "@iconify/icons-mdi/pencil";
import fileDocumentOutline from "@iconify/icons-mdi/file-document-outline";
import animationOutline from "@iconify/icons-mdi/animation-outline";
import collageIcon from "@iconify/icons-mdi/collage";
import cogIcon from "@iconify/icons-mdi/cog";
import aboutIcon from "@iconify/icons-mdi/about";
import { useIntl } from "react-intl";
import { registerSW } from "virtual:pwa-register";
import { isRefreshNeededAtom, updateSWAtom } from "./states/pwa";
import { atom, useAtom, useSetAtom } from "jotai";
import {
	Button,
	ButtonGroup,
	Classes,
	Menu,
	MenuItem,
	Navbar,
	NavbarDivider,
	NavbarGroup,
	NavbarHeading,
} from "@blueprintjs/core";
import { FileSidePage } from "./components/side-page/files";
import { Popover2 } from "@blueprintjs/popover2";
import { AboutPage } from "./components/about-page";
import { EditorCanvas } from "./components/editor";

const rawTabAtom = atom("file");
const tabAtom = atom(
	(get) => get(rawTabAtom),
	(get, set, newValue) => {
		if (get(rawTabAtom) === newValue) {
			set(rawTabAtom, "");
		} else {
			set(rawTabAtom, newValue);
		}
	},
);
export function App() {
	const intl = useIntl();
	const setIsRefreshNeeded = useSetAtom(isRefreshNeededAtom);
	const setUpdateSW = useSetAtom(updateSWAtom);
	const [currentTab, setTab] = useAtom(tabAtom);
	function toggleTab(name: string) {
		return () => setTab(name);
	}
	useEffect(() => {
		const updateSW = registerSW({
			onNeedRefresh: () => {
				setUpdateSW({
					updateSW,
				});
				setIsRefreshNeeded(true);
			},
			onOfflineReady: () => {
				setUpdateSW({
					updateSW,
				});
			},
		});
	}, []);

	return (
		<div className={styles.app}>
			<div>
				<Navbar>
					<NavbarGroup>
						<NavbarHeading>SFSpriteEditor</NavbarHeading>
						<NavbarDivider />
						<Popover2
							modifiers={{
								arrow: {
									enabled: false,
								},
							}}
							placement="bottom-start"
							content={
								<Menu>
									<MenuItem
										text={intl.formatMessage({
											id: "file.new",
											defaultMessage: "New",
										})}
									/>
									<MenuItem
										text={intl.formatMessage({
											id: "file.open",
											defaultMessage: "Open",
										})}
									/>
									<MenuItem
										text={intl.formatMessage({
											id: "file.save",
											defaultMessage: "Save",
										})}
									/>
									<MenuItem
										text={intl.formatMessage({
											id: "file.saveas",
											defaultMessage: "Save As",
										})}
									/>
								</Menu>
							}
							renderTarget={({ isOpen, ref, ...p }) => (
								<Button
									{...p}
									active={isOpen}
									elementRef={ref}
									className={Classes.MINIMAL}
									text={intl.formatMessage({
										id: "tab.file",
										defaultMessage: "File",
									})}
								/>
							)}
						/>
					</NavbarGroup>
				</Navbar>
			</div>
			<div>
				<EditorCanvas />
				{/* Sidebar */}
				<div className={styles.sidebar}>
					<ButtonGroup vertical large>
						<Popover2
							isOpen={currentTab === "file"}
							position="auto"
							content={<FileSidePage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.file",
									defaultMessage: "File",
								})}
								active={currentTab === "file"}
								onClick={toggleTab("file")}
								icon={<Icon icon={fileDocumentOutline} />}
							/>
						</Popover2>
						<Popover2
							isOpen={currentTab === "edit"}
							position="auto"
							content={<FileSidePage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.edit",
									defaultMessage: "Edit",
								})}
								active={currentTab === "edit"}
								onClick={toggleTab("edit")}
								icon={<Icon icon={pencilIcon} />}
							/>
						</Popover2>
						<Popover2
							isOpen={currentTab === "tilesets"}
							position="auto"
							content={<FileSidePage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.tilesets",
									defaultMessage: "Tilesets",
								})}
								active={currentTab === "tilesets"}
								onClick={toggleTab("tilesets")}
								icon={<Icon icon={cubeUnfolded} />}
							/>
						</Popover2>
						<Popover2
							isOpen={currentTab === "palettes"}
							position="auto"
							content={<FileSidePage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.palettes",
									defaultMessage: "Palettes",
								})}
								active={currentTab === "palettes"}
								onClick={toggleTab("palettes")}
								icon={<Icon icon={paletteSwatchVariant} />}
							/>
						</Popover2>
						<Popover2
							isOpen={currentTab === "sprites"}
							position="auto"
							content={<FileSidePage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.sprites",
									defaultMessage: "Sprites",
								})}
								active={currentTab === "sprites"}
								onClick={toggleTab("sprites")}
								icon={<Icon icon={collageIcon} />}
							/>
						</Popover2>
						<Popover2
							isOpen={currentTab === "animations"}
							position="auto"
							content={<FileSidePage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.animations",
									defaultMessage: "Animations",
								})}
								active={currentTab === "animations"}
								onClick={toggleTab("animations")}
								icon={<Icon icon={animationOutline} />}
							/>
						</Popover2>
						<Popover2
							isOpen={currentTab === "options"}
							position="auto"
							content={<FileSidePage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.options",
									defaultMessage: "Options",
								})}
								active={currentTab === "options"}
								onClick={toggleTab("options")}
								icon={<Icon icon={cogIcon} />}
							/>
						</Popover2>
						<Popover2
							isOpen={currentTab === "about"}
							position="auto"
							content={<AboutPage />}
						>
							<Button
								title={intl.formatMessage({
									id: "tab.about",
									defaultMessage: "About",
								})}
								active={currentTab === "about"}
								onClick={toggleTab("about")}
								icon={<Icon icon={aboutIcon} />}
							/>
						</Popover2>
					</ButtonGroup>
				</div>
			</div>
		</div>
	);
}
