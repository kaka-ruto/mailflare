import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	{
		ignores: [
			".next/**",
			".open-next/**",
			"node_modules/**",
			"drizzle/**",
			"dist/**",
			"data/**",
			"deploy/**/node_modules/**",
			"cloudflare-env.d.ts",
			"next-env.d.ts",
		],
	},
	...nextCoreWebVitals,
	...nextTypescript,
	{
		rules: {
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/refs": "warn",
			"react-hooks/purity": "warn",
			"react-hooks/preserve-manual-memoization": "warn",
		},
	},
];

export default eslintConfig;
