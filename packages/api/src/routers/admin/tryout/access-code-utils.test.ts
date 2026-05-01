import { describe, expect, test } from "bun:test";
import { maskCode } from "./access-code-utils";

describe("maskCode", () => {
	test("masks short codes with 4 trailing asterisks", () => {
		expect(maskCode("AB")).toBe("AB****");
	});

	test("masks 4-char codes with 4 trailing asterisks", () => {
		expect(maskCode("ABCD")).toBe("ABCD****");
	});

	test("masks long codes showing first 4 chars and remaining as asterisks", () => {
		expect(maskCode("ABCDEFGHIJ")).toBe("ABCD******");
	});

	test("masks 5-char code with minimum 4 asterisks", () => {
		expect(maskCode("ABCDE")).toBe("ABCD****");
	});

	test("masks 8-char code", () => {
		expect(maskCode("ABCDEFGH")).toBe("ABCD****");
	});
});
