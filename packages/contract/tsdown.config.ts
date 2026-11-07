import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/utils.ts", "src/common/*.ts"],
	format: ["esm"],
	sourcemap: true,
	dts: true,
	clean: true,
	alias: {
		"@/": "./src/",
	},
});
