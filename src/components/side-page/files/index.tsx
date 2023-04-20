import { useAtomValue } from "jotai";
import { FormattedMessage } from "react-intl";
import { openedFilesStatesAtom } from "../../../states";
import "./index.sass";
import { Button, ButtonGroup, Divider } from "@blueprintjs/core";

export const FileSidePage: React.FC = () => {
	const fileList = useAtomValue(openedFilesStatesAtom);

	return (
		<div className="side-page-files">
			<div className="title">当前打开的文件列表</div>
			<Divider />
			<div className="list">
				{fileList.length === 0 ? (
					<div className="no-files">无</div>
				) : (
					fileList.map((v, i) => {
						return (
							<ButtonGroup fill key={i + v.fileName}>
								<Button
									text={v.fileName}
									icon={
										<img
											alt=""
											onLoad={(evt) => evt.target.classList.remove("failed")}
											onError={(evt) => evt.target.classList.remove("failed")}
											className="preview-image"
											src={v.previewImageUrl}
										/>
									}
								/>
								<Button icon="delete" />
							</ButtonGroup>
						);
					})
				)}
			</div>
		</div>
	);
};
