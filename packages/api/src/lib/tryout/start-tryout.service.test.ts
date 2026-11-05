import { describe, expect, test } from "bun:test";
import { createStartTryoutService, type StartTryoutDependencies } from "./start-tryout.service";
import { TryoutError } from "./tryout-error";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");

type DrizzleTable = { [DRIZZLE_NAME]: string };
type Awaitable = Promise<void> & { returning: () => Promise<unknown[]> };

const user = { id: "user-1", isPremium: false, tryoutCredits: 2 };
const subtest = {
	id: 10,
	tryoutId: 1,
	name: "Subtest",
	description: null,
	duration: 30,
	questionOrder: "sequential",
	order: 1,
	scoringMap: null,
};
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
	subtests: [subtest],
};
const accessCode = { id: 7, isActive: true, expiresAt: null, maxUses: 5, usedCount: 0 };

function makeMockTrx({ quotaLeft = true, creditsAfter = 1 } = {}) {
	const inserts: Array<{ table: string; values: Record<string, unknown> }> = [];
	const updates: Array<{ table: string; set: Record<string, unknown> }> = [];

	const trx = {
		insert(table: DrizzleTable) {
			return {
				values(values: Record<string, unknown>) {
					inserts.push({ table: table[DRIZZLE_NAME], values });
					const result = Promise.resolve() as Awaitable;
					result.returning = async () => [{ id: 99, score: null, ...values }];
					return result;
				},
			};
		},
		update(table: DrizzleTable) {
			return {
				set(set: Record<string, unknown>) {
					return {
						where() {
							updates.push({ table: table[DRIZZLE_NAME], set });
							const result = Promise.resolve() as Awaitable;
							result.returning = async () => {
								if (table[DRIZZLE_NAME] === "tryout_access_code") return quotaLeft ? [{ id: 7 }] : [];
								if (table[DRIZZLE_NAME] === "user") return [{ tryoutCredits: creditsAfter }];
								return [];
							};
							return result;
						},
					};
				},
			};
		},
	};

	return { trx, inserts, updates };
}

function deps(overrides: Partial<StartTryoutDependencies> = {}): StartTryoutDependencies {
	return {
		findTryout: async () => tryout,
		findAccessCode: async () => accessCode,
		findAttempt: async () => undefined,
		runInTransaction: async (fn) => fn(null as never),
		...overrides,
	};
}

describe("start tryout service", () => {
	test("rejects a missing published tryout", async () => {
		const service = createStartTryoutService(deps({ findTryout: async () => undefined }));
		await expect(service.start({ id: 1 }, user)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
	});

	test("enforces access and credit requirements before creating an attempt", async () => {
		const service = createStartTryoutService(deps({ findAccessCode: async () => undefined }));
		await expect(service.start({ id: 1 }, user)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses",
		});
		await expect(service.start({ id: 1, useCredit: true }, { ...user, tryoutCredits: 0 })).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kredit tryout tidak cukup",
		});
	});

	test("rejects a tryout that has not opened", async () => {
		const service = createStartTryoutService(
			deps({ findTryout: async () => ({ ...tryout, startsAt: new Date("2100-01-01") }) }),
		);
		await expect(service.start({ id: 1, imageUrl: "proof" }, user)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout belum dimulai",
		});
	});

	test("reports expected failures as TryoutError", async () => {
		const service = createStartTryoutService(deps({ findTryout: async () => undefined }));
		await expect(service.start({ id: 1 }, user)).rejects.toBeInstanceOf(TryoutError);
	});

	test("consumes an access code and opens the first subtest", async () => {
		const { trx, inserts, updates } = makeMockTrx();
		const service = createStartTryoutService(deps({ runInTransaction: async (fn) => fn(trx as never) }));

		const result = await service.start({ id: 1, accessCode: "CODE" }, user);

		expect(result).toMatchObject({ id: 99, usedAccessCode: true, usedCredit: false });
		expect(updates.find((update) => update.table === "tryout_access_code")).toBeDefined();
		expect(inserts.find((insert) => insert.table === "tryout_subtest_attempt")?.values).toMatchObject({
			subtestId: 10,
		});
		expect(inserts.find((insert) => insert.table === "credit_transaction")).toBeUndefined();
	});

	test("deducts a credit and records it in the ledger", async () => {
		const { trx, inserts, updates } = makeMockTrx({ creditsAfter: 1 });
		const service = createStartTryoutService(deps({ runInTransaction: async (fn) => fn(trx as never) }));

		const result = await service.start({ id: 1, useCredit: true }, user);

		expect(result).toMatchObject({ id: 99, usedCredit: true, usedAccessCode: false });
		expect(updates.find((update) => update.table === "user")?.set.tryoutCredits).toBeDefined();
		expect(inserts.find((insert) => insert.table === "credit_transaction")?.values).toMatchObject({
			amount: -1,
			balanceAfter: 1,
		});
	});

	test("never deducts a credit from a premium user", async () => {
		const { trx, inserts, updates } = makeMockTrx();
		const service = createStartTryoutService(deps({ runInTransaction: async (fn) => fn(trx as never) }));

		const result = await service.start({ id: 1, useCredit: true }, { ...user, isPremium: true });

		expect(result).toMatchObject({ usedCredit: false });
		expect(updates.find((update) => update.table === "user")).toBeUndefined();
		expect(inserts.find((insert) => insert.table === "credit_transaction")).toBeUndefined();
	});

	test("does not spend the code quota when access already came from elsewhere", async () => {
		const { trx, updates } = makeMockTrx();
		const service = createStartTryoutService(deps({ runInTransaction: async (fn) => fn(trx as never) }));

		const result = await service.start({ id: 1, accessCode: "CODE" }, { ...user, isPremium: true });

		expect(result).toMatchObject({ usedAccessCode: false, accessCodeId: null });
		expect(updates.find((update) => update.table === "tryout_access_code")).toBeUndefined();
	});

	test("does not spend the code quota when a credit pays for the attempt", async () => {
		const { trx, inserts, updates } = makeMockTrx();
		const service = createStartTryoutService(deps({ runInTransaction: async (fn) => fn(trx as never) }));

		const result = await service.start({ id: 1, accessCode: "CODE", useCredit: true }, user);

		expect(result).toMatchObject({ usedCredit: true, usedAccessCode: false, accessCodeId: null });
		expect(updates.find((update) => update.table === "tryout_access_code")).toBeUndefined();
		expect(inserts.find((insert) => insert.table === "credit_transaction")).toBeDefined();
	});

	test("aborts the whole start when the access code quota is exhausted", async () => {
		const { trx, inserts } = makeMockTrx({ quotaLeft: false });
		const service = createStartTryoutService(deps({ runInTransaction: async (fn) => fn(trx as never) }));

		await expect(service.start({ id: 1, accessCode: "CODE" }, user)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kuota kode akses sudah habis",
		});
		expect(inserts.find((insert) => insert.table === "tryout_subtest_attempt")).toBeUndefined();
	});

	test("returns the attempt that already exists without starting another", async () => {
		const existing = { id: 42, score: "700", isRevoked: false };
		const { trx, inserts } = makeMockTrx();
		const service = createStartTryoutService(
			deps({ findAttempt: async () => existing as never, runInTransaction: async (fn) => fn(trx as never) }),
		);

		expect(await service.start({ id: 1, imageUrl: "proof" }, user)).toMatchObject({ id: 42, score: 700 });
		expect(inserts).toHaveLength(0);
	});
});
