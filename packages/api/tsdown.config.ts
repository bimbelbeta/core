import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/context.ts", "src/routers/index.ts"],
	format: ["esm"],
	sourcemap: true,
	dts: true,
	clean: true,
	alias: {
		"@/": "./src/",
	},
});
