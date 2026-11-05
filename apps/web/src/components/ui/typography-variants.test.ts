import { describe, expect, test } from "bun:test";
import { typographyVariants } from "./typography-variants";

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
		for (const [variant, config] of Object.entries(typographyVariants)) {
			for (const token of config.className.match(/\btext-[\w[\]().,#%-]+/g) ?? []) {
				expect(nonColour.test(token), `${variant}: ${token}`).toBe(true);
			}
		}
	});
});

import { typographyTones } from "./typography-variants";

describe("typographyTones", () => {
	test("the tone set is closed and every tone resolves to a real colour", () => {
		expect(Object.values(typographyTones).sort()).toEqual([
			"",
			"text-destructive",
			"text-muted-foreground",
			"text-primary-800",
		]);
	});
});
