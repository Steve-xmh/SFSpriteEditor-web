import { FunctionComponent } from 'preact'
import { FormattedDisplayName, FormattedMessage } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import { getLanguage, getOption, setLanguage, toggleOption } from '../reducers/options'
import lang from '../utils/lang'

export const OptionsPage: FunctionComponent = () => {
    const dispatch = useDispatch()
    const currentLanguage = useSelector(getLanguage)
    const displayDebugMessages = useSelector(getOption('displayDebugMessages'))
    const showSubSpriteBounds = useSelector(getOption('showSubSpriteBounds'))
    return <>
        <div>OptionsPage</div>
        <div>
            <label><FormattedMessage id="options.language" defaultMessage='Display Language' /></label>
            <select onChange={evt => dispatch(setLanguage(evt.currentTarget.value))} value={currentLanguage}>
                {
                    Object.keys(lang).map(lang => <option key={lang} value={lang}>
                        <FormattedDisplayName type='language' value={lang} />
                    </option>)
                }
            </select>
        </div>
        <div>
            <label><FormattedMessage id="options.display-debug-message" defaultMessage='Display Debug Messages' /></label>
            <input type='checkbox' checked={displayDebugMessages} onClick={() => dispatch(toggleOption('displayDebugMessages'))} />
        </div>
        <div>
            <label><FormattedMessage id="options.display-subsprite-bounds" defaultMessage='Display Subsprite bounds' /></label>
            <input type='checkbox' checked={showSubSpriteBounds} onClick={() => dispatch(toggleOption('showSubSpriteBounds'))} />
        </div>
    </>
}
