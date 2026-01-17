import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/**/*.ts",
	format: ["esm"],
	sourcemap: true,
	dts: true,
	clean: true,
});
