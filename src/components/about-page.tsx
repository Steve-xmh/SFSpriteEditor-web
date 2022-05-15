import { FunctionComponent } from 'preact'
import { FormattedMessage } from 'react-intl'
import { useSelector } from 'react-redux'
import { getUpdateSW, isRefreshNeeded } from '../reducers/pwa'

export const AboutPage: FunctionComponent = () => {
    const needRefresh = useSelector(isRefreshNeeded)
    const updateSW = useSelector(getUpdateSW)
    return <div style={{ margin: '1rem' }}>
        <h4>SFSpriteEditor Web</h4>
        <h5>By SteveXMH</h5>
        {
            needRefresh && <div>
                <FormattedMessage id="pwa.needrefresh" defaultMessage="Editor has updated!" />
                <button onClick={() => updateSW()}>
                    <FormattedMessage id="pwa.refresh" defaultMessage="Click to refresh and update" />
                </button>
            </div>
        }
        <a href="https://github.com/Steve-xmh/SFSpriteEditor-web">Github</a>
        <h3><FormattedMessage id='about.credits.title' defaultMessage="Credits"/></h3>
        <ul>
            <li>
                <a href="https://github.com/Prof9">
                    <FormattedMessage id='about.credits.prof9' defaultMessage="Prof. 9"/>
                </a>
            </li>
            <li>
                <a href="https://forums.therockmanexezone.com/mmsf-sprite-archive-format-t16527.html#p352109">
                    <FormattedMessage id='about.credits.prof9-sprite-file-struct' defaultMessage="Prof. 9's description of Sprite File Structure"/>
                </a>
            </li>
            <li>
                <a href="https://github.com/brianuuu/BNSpriteEditor">
                    <FormattedMessage id='about.credits.bnspriteeditor' defaultMessage="BNSpriteEditor"/>
                </a>
            </li>
            <li>
                <a href="https://forums.therockmanexezone.com/viewtopic.php?p=352348#p352348">
                    <FormattedMessage id='about.credits.topic-of-bnspriteeditor' defaultMessage="The topic of BNSpriteEditor"/>
                </a>
            </li>
        </ul>
    </div>
}
