import { render } from 'preact'
import { App } from './app'
import store, { MainStore } from './reducers'
import { Provider, useSelector } from 'react-redux'
import './index.css'
import 'preact/debug'
import { IntlProvider } from 'react-intl'
import messages from './utils/lang'
import { getLanguage } from './reducers/options'

const AppHOC = () => {
    const lang = useSelector(getLanguage)
    return <IntlProvider messages={messages[lang]} locale={lang} defaultLocale='en'>
        <App />
    </IntlProvider>
}

render(
    <Provider store={store}>
        <AppHOC />
    </Provider>
    , document.getElementById('app')
)
