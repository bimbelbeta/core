import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/**/*.ts",
		"!src/**/*.test.ts",
		"!src/**/*.spec.ts",
		"!src/**/__tests__/**",
		"!src/**/__mocks__/**",
	],
	format: ["esm"],
	sourcemap: true,
	dts: true,
});
