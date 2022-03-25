import { FunctionComponent } from "preact";
import { FormattedDisplayName, FormattedMessage } from "react-intl";
import { useDispatch, useSelector } from "react-redux"
import { MainStore } from "../reducers";
import { getLanguage, setLanguage } from "../reducers/options";
import lang from "../utils/lang";

export const OptionsPage: FunctionComponent = () => {
    const dispatch = useDispatch()
    const currentLanguage = useSelector(getLanguage)
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
    </>;
};