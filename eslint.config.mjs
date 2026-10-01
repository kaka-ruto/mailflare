import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	{
		ignores: [
			".next/**",
			".next-node/**",
			".vinext/**",
			".wrangler/**",
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
		// React Compiler advisories: upstream code does not satisfy these yet.
		rules: {
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/refs": "warn",
			"react-hooks/purity": "warn",
			"react-hooks/preserve-manual-memoization": "warn",
		},
	},
];

export default eslintConfig;
