import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

const config = [
	...compat.extends("next/core-web-vitals"),
	{
		rules: {
			"@next/next/no-img-element": "off",
			"@next/next/no-html-link-for-pages": "off",
		},
	},
	{
        // Ignores has to go in its own config object
		ignores: ["coverage/**/*", ".next/**/*"],
	},
];

export default config;
