import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa";
import svgLoader from "vite-svg-loader";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
	base: "/SFSpriteEditor-web/",
	plugins: [
		react(),
		svgLoader(),
		wasm(),
		topLevelAwait(),
		VitePWA({
			registerType: "autoUpdate",
			injectRegister: "script",
			workbox: {
				globPatterns: ["**/*.{js,css,html}", "assets/**/*"],
			},
			manifest: {
				name: "SFSpriteEditor Web",
				description:
					"A tool for editing sprites from the MegaMan Star Force series (aka Ryuusei no Rockman series).",
				icons: [
					{
						src: "icon.png",
						sizes: "144x144",
						type: "image/png",
					},
				],
			},
		}),
	],
	css: {
		modules: {
			localIdentName: "[local]_[hash:base64:5]",
			localsConvention: "camelCaseOnly",
		},
	},
});
