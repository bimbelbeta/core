import { describe, expect, test } from "bun:test";
import { formatCount, formatRupiah, getInitials } from "./formatter";

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

describe("formatRupiah", () => {
	test("writes Rp with no space and Indonesian separators", () => {
		expect(formatRupiah(50000)).toBe("Rp50.000");
		expect(formatRupiah(1800000)).toBe("Rp1.800.000");
	});

	test("drops the fractional part", () => {
		expect(formatRupiah(50000.6)).toBe("Rp50.001");
		expect(formatRupiah(0)).toBe("Rp0");
	});

	test("accepts the string prices the API returns", () => {
		expect(formatRupiah("50000")).toBe("Rp50.000");
		expect(formatRupiah("50000.00")).toBe("Rp50.000");
	});

	test("keeps the sign outside the symbol", () => {
		expect(formatRupiah(-50000)).toBe("-Rp50.000");
	});
});
