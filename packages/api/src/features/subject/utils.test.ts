import { describe, expect, test } from "bun:test";
import { validateGradeLevel } from "./utils";

describe("validateGradeLevel", () => {
	describe("sd", () => {
		test("accepts grade 1", () => {
			expect(validateGradeLevel("sd", 1)).toEqual({ valid: true });
		});

		test("accepts grade 6", () => {
			expect(validateGradeLevel("sd", 6)).toEqual({ valid: true });
		});

		test("rejects grade 0", () => {
			const result = validateGradeLevel("sd", 0);
			expect(result.valid).toBe(false);
			expect(result.message).toContain("1");
			expect(result.message).toContain("6");
		});

		test("rejects grade 7", () => {
			const result = validateGradeLevel("sd", 7);
			expect(result.valid).toBe(false);
		});
	});

	describe("smp", () => {
		test("accepts grade 7", () => {
			expect(validateGradeLevel("smp", 7)).toEqual({ valid: true });
		});

		test("accepts grade 9", () => {
			expect(validateGradeLevel("smp", 9)).toEqual({ valid: true });
		});

		test("rejects grade 6", () => {
			const result = validateGradeLevel("smp", 6);
			expect(result.valid).toBe(false);
		});

		test("rejects grade 10", () => {
			const result = validateGradeLevel("smp", 10);
			expect(result.valid).toBe(false);
		});
	});

	describe("sma", () => {
		test("accepts grade 10", () => {
			expect(validateGradeLevel("sma", 10)).toEqual({ valid: true });
		});

		test("accepts grade 12", () => {
			expect(validateGradeLevel("sma", 12)).toEqual({ valid: true });
		});

		test("rejects grade 9", () => {
			const result = validateGradeLevel("sma", 9);
			expect(result.valid).toBe(false);
		});

		test("rejects grade 13", () => {
			const result = validateGradeLevel("sma", 13);
			expect(result.valid).toBe(false);
		});
	});

	describe("utbk", () => {
		test("rejects any grade level", () => {
			const result = validateGradeLevel("utbk", 1);
			expect(result.valid).toBe(false);
			expect(result.message).toContain("UTBK");
		});
	});

	test("invalid category returns error with category name", () => {
		const result = validateGradeLevel("unknown", 1);
		expect(result.valid).toBe(false);
		expect(result.message).toContain("unknown");
	});
});
