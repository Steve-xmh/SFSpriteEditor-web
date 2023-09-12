import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Provider } from "jotai";
import "./index.sass";
import messages from "./utils/lang";

const AppHOC = () => {
	const lang = "zh-CN";
	return (
		<App />
	);
};

createRoot(document.getElementById("app")).render(
	<Provider>
		<AppHOC />
	</Provider>,
);
