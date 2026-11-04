import { afterAll, afterEach, describe, expect, spyOn, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { startTryout } from "./start-tryout.service";
import { TryoutError } from "./tryout-error";

const findTryout = spyOn(db.query.tryout, "findFirst");
const user = { id: "user-1", isPremium: false, tryoutCredits: 0 };
const tryout = {
	id: 1,
	title: "Tryout",
	description: null,
	passingGrade: 600,
	category: "utbk" as const,
	status: "published" as const,
	startsAt: null,
	endsAt: null,
	createdAt: null,
	updatedAt: null,
	subtests: [],
};

afterEach(() => findTryout.mockReset());
afterAll(() => findTryout.mockRestore());

describe("start tryout service", () => {
	test("rejects a missing published tryout", async () => {
		findTryout.mockResolvedValueOnce(undefined);
		try {
			await startTryout({ id: 1 }, user);
			throw new Error("Expected a failure");
		} catch (error) {
			expect(error).toBeInstanceOf(TryoutError);
			expect(error).toMatchObject({ code: "NOT_FOUND", message: "Tryout tidak ditemukan" });
		}
	});

	test("enforces access and credit requirements before creating an attempt", async () => {
		findTryout.mockResolvedValueOnce(tryout);
		await expect(startTryout({ id: 1 }, user)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses",
		});
		findTryout.mockResolvedValueOnce(tryout);
		await expect(startTryout({ id: 1, useCredit: true }, user)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kredit tryout tidak cukup",
		});
	});

	test("rejects a tryout that has not opened", async () => {
		findTryout.mockResolvedValueOnce({ ...tryout, startsAt: new Date("2100-01-01") });
		await expect(startTryout({ id: 1, imageUrl: "proof" }, user)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout belum dimulai",
		});
	});
});
