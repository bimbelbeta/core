import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/routers/index.ts", "src/context.ts"],
	format: ["esm"],
	sourcemap: true,
	dts: true,
	clean: true,
	alias: {
		"@/": "./src/",
	},
});
