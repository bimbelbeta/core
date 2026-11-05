import { describe, expect, test } from "bun:test";
import { getInitials } from "./formatter";

describe("getInitials", () => {
	test("takes the first letter of the first two words", () => {
		expect(getInitials("John Doe")).toBe("JD");
		expect(getInitials("ada lovelace king")).toBe("AL");
	});

	test("collapses repeated and surrounding whitespace", () => {
		expect(getInitials("  John   Doe  ")).toBe("JD");
	});

	test("handles a single word", () => {
		expect(getInitials("Cher")).toBe("C");
	});
});
