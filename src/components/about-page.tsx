import { FunctionComponent } from "react";
import { FormattedMessage } from "react-intl";
import { useAtomValue } from "jotai";
import { isRefreshNeededAtom, updateSWAtom } from "../states/pwa";

export const AboutPage: FunctionComponent = () => {
	const needRefresh = useAtomValue(isRefreshNeededAtom);
	const updateSW = useAtomValue(updateSWAtom);
	return (
		<div style={{ padding: "1rem" }}>
			<h4>SFSpriteEditor Web</h4>
			<h5>By SteveXMH</h5>
			{needRefresh && (
				<div>
					<FormattedMessage
						id="pwa.needrefresh"
						defaultMessage="Editor has updated!"
					/>
					<button onClick={() => updateSW.updateSW()}>
						<FormattedMessage
							id="pwa.refresh"
							defaultMessage="Click to refresh and update"
						/>
					</button>
				</div>
			)}
			<a href="https://github.com/Steve-xmh/SFSpriteEditor-web">Github</a>
			<h3>
				<FormattedMessage id='about.credits.title' defaultMessage="Credits" />
			</h3>
			<ul>
				<li>
					<a href="https://github.com/Prof9">
						<FormattedMessage
							id='about.credits.prof9'
							defaultMessage="Prof. 9"
						/>
					</a>
				</li>
				<li>
					<a href="https://forums.therockmanexezone.com/mmsf-sprite-archive-format-t16527.html#p352109">
						<FormattedMessage
							id='about.credits.prof9-sprite-file-struct'
							defaultMessage="Prof. 9's description of Sprite File Structure"
						/>
					</a>
				</li>
				<li>
					<a href="https://github.com/brianuuu/BNSpriteEditor">
						<FormattedMessage
							id='about.credits.bnspriteeditor'
							defaultMessage="BNSpriteEditor"
						/>
					</a>
				</li>
				<li>
					<a href="https://forums.therockmanexezone.com/viewtopic.php?p=352348#p352348">
						<FormattedMessage
							id='about.credits.topic-of-bnspriteeditor'
							defaultMessage="The topic of BNSpriteEditor"
						/>
					</a>
				</li>
			</ul>
		</div>
	);
};
