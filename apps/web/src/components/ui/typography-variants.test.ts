import { describe, expect, test } from "bun:test";
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

	test("every variant default tone exists", () => {
		for (const config of Object.values(typographyVariants)) {
			expect(typographyTones).toHaveProperty(config.tone);
		}
	});
});
