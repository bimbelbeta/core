import { describe, expect, test } from "bun:test";
import { type StartTryoutDependencies, startTryout } from "./start-tryout.service";
import { TryoutError } from "./tryout-error";

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

function deps(overrides: Partial<StartTryoutDependencies> = {}): StartTryoutDependencies {
	return {
		findTryout: async () => undefined,
		findAccessCode: async () => undefined,
		findAttempt: async () => undefined,
		runInTransaction: async (fn) => fn(null as never),
		...overrides,
	};
}

describe("start tryout service", () => {
	test("rejects a missing published tryout", async () => {
		await expect(startTryout({ id: 1 }, user, deps())).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
	});

	test("enforces access and credit requirements before creating an attempt", async () => {
		const withTryout = deps({ findTryout: async () => tryout });
		await expect(startTryout({ id: 1 }, user, withTryout)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses",
		});
		await expect(startTryout({ id: 1, useCredit: true }, user, withTryout)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kredit tryout tidak cukup",
		});
	});

	test("rejects a tryout that has not opened", async () => {
		const notOpen = deps({ findTryout: async () => ({ ...tryout, startsAt: new Date("2100-01-01") }) });
		await expect(startTryout({ id: 1, imageUrl: "proof" }, user, notOpen)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout belum dimulai",
		});
	});

	test("reports expected failures as TryoutError", async () => {
		await expect(startTryout({ id: 1 }, user, deps())).rejects.toBeInstanceOf(TryoutError);
	});
});
