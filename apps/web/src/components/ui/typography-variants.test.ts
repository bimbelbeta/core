import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { typographyTones, typographyVariants } from "./typography-variants";

describe("typographyVariants", () => {
	test("the variant set is closed", () => {
		expect(Object.keys(typographyVariants).sort()).toEqual([
			"body",
			"caption",
			"display",
			"hero",
			"overline",
			"subtitle1",
			"subtitle2",
			"title",
		]);
	});

	test("maps each variant to its semantic element", () => {
		expect(typographyVariants.hero.element).toBe("h1");
		expect(typographyVariants.display.element).toBe("h1");
		expect(typographyVariants.title.element).toBe("h1");
		expect(typographyVariants.subtitle1.element).toBe("h2");
		expect(typographyVariants.subtitle2.element).toBe("h3");
		expect(typographyVariants.body.element).toBe("p");
		expect(typographyVariants.caption.element).toBe("p");
		expect(typographyVariants.overline.element).toBe("p");
	});

	test("no variant keeps colour in its className — that is what tone is for", () => {
		const nonColour =
			/^text-(?:xs|sm|base|lg|xl|[2-9]xl|center|left|right|justify|start|end|balance|pretty|wrap|nowrap|ellipsis|clip)$/;
		const colourAxis = /\b(?:bg|border|fill|stroke|ring|outline|divide|from|to|via)-[\w[\]().,#%-]+/;
		for (const [variant, config] of Object.entries(typographyVariants)) {
			expect(config.className.match(colourAxis), variant).toBeNull();
			for (const token of config.className.match(/\btext-[\w[\]().,#%-]+/g) ?? []) {
				expect(nonColour.test(token), `${variant}: ${token}`).toBe(true);
			}
		}
	});
});

describe("variant default tones", () => {
	test("each variant carries the tone the spec assigns it", () => {
		expect(Object.fromEntries(Object.entries(typographyVariants).map(([name, config]) => [name, config.tone]))).toEqual(
			{
				hero: "default",
				display: "default",
				title: "default",
				subtitle1: "default",
				subtitle2: "default",
				body: "default",
				caption: "muted",
				overline: "default",
			},
		);
	});
});

describe("typographyTones", () => {
	test("the tone set is closed", () => {
		expect(Object.values(typographyTones).sort()).toEqual([
			"",
			"text-muted-foreground",
			"text-primary-800",
			"text-red-200",
		]);
	});

	test("every tone colour is a token this theme defines", () => {
		const css = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
		for (const className of Object.values(typographyTones)) {
			for (const token of className.match(/\btext-[\w-]+/g) ?? []) {
				expect(css.includes(`--color-${token.slice(5)}:`), token).toBe(true);
			}
		}
	});
});
