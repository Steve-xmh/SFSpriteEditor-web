import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Provider } from "jotai";
import "./index.css";
import { IntlProvider } from "react-intl";
import messages from "./utils/lang";

const AppHOC = () => {
	const lang = "zh-CN";
	return (
		<IntlProvider messages={messages[lang]} locale={lang} defaultLocale='en'>
			<App />
		</IntlProvider>
	);
};

createRoot(document.getElementById("app")).render(
	<Provider>
		<AppHOC />
	</Provider>,
);
