import { FunctionComponent } from "react";
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
					Editor has updated!
					<button onClick={() => updateSW.updateSW()}>
						Click to refresh and update
					</button>
				</div>
			)}
			<a href="https://github.com/Steve-xmh/SFSpriteEditor-web">Github</a>
			<h3>Credits</h3>
			<ul>
				<li>
					<a href="https://github.com/Prof9">Prof. 9</a>
				</li>
				<li>
					<a href="https://forums.therockmanexezone.com/mmsf-sprite-archive-format-t16527.html#p352109">
					Prof. 9's description of Sprite File Structure
					</a>
				</li>
				<li>
					<a href="https://github.com/brianuuu/BNSpriteEditor">
					BNSpriteEditor
					</a>
				</li>
				<li>
					<a href="https://forums.therockmanexezone.com/viewtopic.php?p=352348#p352348">
					The topic of BNSpriteEditor
					</a>
				</li>
			</ul>
		</div>
	);
};
