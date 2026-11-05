import { describe, expect, test } from "bun:test";
import { formatCount, getInitials } from "./formatter";

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

describe("formatCount", () => {
	test("groups thousands the Indonesian way", () => {
		expect(formatCount(1234)).toBe("1.234");
		expect(formatCount(1234567)).toBe("1.234.567");
		expect(formatCount(12)).toBe("12");
	});
});
