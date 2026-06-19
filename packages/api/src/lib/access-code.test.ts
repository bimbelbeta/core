import { describe, expect, test } from "bun:test";
import { hashAccessCode } from "./access-code";

describe("hashAccessCode", () => {
	test("hashes consistently for the same input", () => {
		const code = "my-secret-code";
		expect(hashAccessCode(code)).toBe(hashAccessCode(code));
	});

	test("different inputs produce different hashes", () => {
		expect(hashAccessCode("code-a")).not.toBe(hashAccessCode("code-b"));
	});

	test("works with empty string", () => {
		const result = hashAccessCode("");
		expect(typeof result).toBe("string");
		expect(result.length).toBe(64);
	});

	test("produces a 64-character hex string", () => {
		const result = hashAccessCode("test");
		expect(result).toMatch(/^[0-9a-f]{64}$/);
	});
});
