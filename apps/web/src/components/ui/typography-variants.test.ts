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
		for (const [variant, config] of Object.entries(typographyVariants)) {
			expect(config.className, variant).not.toMatch(
				/text-(white|black|current|primary|secondary|tertiary|neutral|muted|destructive|green|red|blue|amber|yellow|gray)/,
			);
		}
	});
});
