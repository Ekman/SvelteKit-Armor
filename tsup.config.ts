import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"browser/index": "src/browser/index.ts",
	},
	format: ["esm", "cjs"],
	sourcemap: true,
});
