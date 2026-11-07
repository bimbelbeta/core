import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/schema/*.ts"],
	format: ["esm"],
	sourcemap: true,
	dts: true,
	clean: true,
	alias: {
		"@/": "./src/",
	},
});
