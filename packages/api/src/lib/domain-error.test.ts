import { describe, expect, test } from "bun:test";
import { DomainError, withErrorFallback } from "./domain-error";

describe("withErrorFallback", () => {
	test("returns the value when the work succeeds", async () => {
		expect(await withErrorFallback("Gagal menyimpan.", async () => "ok")).toBe("ok");
	});

	test("turns an unexpected failure into INTERNAL_SERVER_ERROR with the given message", async () => {
		const call = withErrorFallback("Gagal menyimpan.", async () => {
			throw new Error("connection reset");
		});

		await expect(call).rejects.toMatchObject({
			name: "DomainError",
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal menyimpan.",
		});
	});

	test("lets a domain error through unchanged so its code survives", async () => {
		const call = withErrorFallback("Gagal menyimpan.", async () => {
			throw new DomainError("NOT_FOUND", "Tryout tidak ditemukan");
		});

		await expect(call).rejects.toMatchObject({
			name: "DomainError",
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
	});
});
