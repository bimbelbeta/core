import { describe, expect, test } from "bun:test";
import { typographyTones, typographyVariants } from "./typography-variants";

describe("typographyVariants", () => {
	test("maps each variant to its semantic element", () => {
		expect(typographyVariants.display.element).toBe("h1");
		expect(typographyVariants.title.element).toBe("h1");
		expect(typographyVariants.subtitle1.element).toBe("h2");
		expect(typographyVariants.subtitle2.element).toBe("h3");
		expect(typographyVariants.body.element).toBe("p");
		expect(typographyVariants.caption.element).toBe("p");
		expect(typographyVariants.overline.element).toBe("h2");
	});

	test("every variant has a non-empty class name", () => {
		for (const config of Object.values(typographyVariants)) {
			expect(config.className.length).toBeGreaterThan(0);
		}
	});

	test("every variant default tone exists", () => {
		for (const config of Object.values(typographyVariants)) {
			expect(typographyTones).toHaveProperty(config.tone);
		}
	});

	test("no variant is missing a tone or element", () => {
		for (const [variant, config] of Object.entries(typographyVariants)) {
			expect(config.element, variant).toBeString();
			expect(config.tone, variant).toBeString();
		}
	});
});
