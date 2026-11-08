import { describe, expect, test } from "bun:test";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { createStringIdCursor } from "@/lib/pagination/cursor";
import type { CreditRepository } from "./repository";
import { createCreditService } from "./service";

const caller = {
	id: "user-1",
	name: "Anggota",
	email: "anggota@example.com",
	emailVerified: true,
	image: null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
	role: "user",
	isPremium: false,
	premiumExpiresAt: null,
	tryoutCredits: 3,
	targetUniversityId: null,
	targetStudyProgramId: null,
} satisfies Session["user"];

const emptyRepository = {
	findUserCreditBalance: async () => undefined,
	listCreditPackages: async () => [],
	findUserCreditSummary: async () => undefined,
	listCreditHistory: async () => [],
	applyCreditAdjustment: async () => ({ newBalance: 0 }),
	deductCreditForTryoutAttempt: async () => ({ balanceAfter: 0 }),
	grantPurchasedCredits: async () => ({ balanceAfter: 0 }),
};

function makeRepository(overrides: Partial<CreditRepository> = {}): CreditRepository {
	const repository: CreditRepository = {
		findUserCreditBalance: overrides.findUserCreditBalance ?? emptyRepository.findUserCreditBalance,
		listCreditPackages: overrides.listCreditPackages ?? emptyRepository.listCreditPackages,
		findUserCreditSummary: overrides.findUserCreditSummary ?? emptyRepository.findUserCreditSummary,
		listCreditHistory: overrides.listCreditHistory ?? emptyRepository.listCreditHistory,
		applyCreditAdjustment: overrides.applyCreditAdjustment ?? emptyRepository.applyCreditAdjustment,
		deductCreditForTryoutAttempt:
			overrides.deductCreditForTryoutAttempt ?? emptyRepository.deductCreditForTryoutAttempt,
		grantPurchasedCredits: overrides.grantPurchasedCredits ?? emptyRepository.grantPurchasedCredits,
		transaction: async (fn) => fn(repository),
		...overrides,
	};
	return repository;
}

function makeService(repository: CreditRepository) {
	return createCreditService({ repository });
}

describe("credit service balance", () => {
	test("returns the caller's stored credit balance", async () => {
		const service = makeService(
			makeRepository({
				findUserCreditBalance: async (userId) => (userId === caller.id ? { tryoutCredits: 5 } : { tryoutCredits: 99 }),
			}),
		);

		expect(await service.balance(caller)).toEqual({ balance: 5 });
	});

	test("treats a missing or null balance as zero", async () => {
		const nullBalance = makeService(makeRepository({ findUserCreditBalance: async () => ({ tryoutCredits: null }) }));
		expect(await nullBalance.balance(caller)).toEqual({ balance: 0 });

		const noRow = makeService(makeRepository());
		expect(await noRow.balance(caller)).toEqual({ balance: 0 });
	});
});

describe("credit service adjust", () => {
	test("reports a missing target user as NOT_FOUND with an Indonesian message", async () => {
		const service = makeService(makeRepository());

		try {
			await service.adjust({ userId: "missing", amount: 1 });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "NOT_FOUND");
			expect(error).toHaveProperty("message", "User tidak ditemukan");
		}
	});

	test("refuses an adjustment that would drop the balance below zero", async () => {
		const service = makeService(makeRepository({ findUserCreditBalance: async () => ({ tryoutCredits: 2 }) }));

		try {
			await service.adjust({ userId: "user-1", amount: -5 });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "BAD_REQUEST");
			expect(error).toHaveProperty("message", "Kredit tidak boleh negatif");
		}
	});

	test("grants credits through a transactional write, labelling an unnoted grant", async () => {
		const writes: Parameters<CreditRepository["applyCreditAdjustment"]>[0][] = [];
		const transactional = makeRepository({
			applyCreditAdjustment: async (params) => {
				writes.push(params);
				return { newBalance: 8 };
			},
		});
		const repository = makeRepository({
			findUserCreditBalance: async () => ({ tryoutCredits: 5 }),
			transaction: async (fn) => fn(transactional),
		});
		const service = createCreditService({ repository });

		expect(await service.adjust({ userId: "user-2", amount: 3 })).toEqual({
			userId: "user-2",
			previousBalance: 5,
			newBalance: 8,
			adjustment: 3,
		});
		expect(writes).toEqual([{ userId: "user-2", amount: 3, note: "Admin grant", fallbackBalanceAfter: 8 }]);
	});

	test("keeps an explicit note and reports the balance the write produced", async () => {
		const writes: Parameters<CreditRepository["applyCreditAdjustment"]>[0][] = [];
		const service = makeService(
			makeRepository({
				findUserCreditBalance: async () => ({ tryoutCredits: null }),
				applyCreditAdjustment: async (params) => {
					writes.push(params);
					return { newBalance: 4 };
				},
			}),
		);

		expect(await service.adjust({ userId: "user-2", amount: 2, note: "Koreksi manual" })).toEqual({
			userId: "user-2",
			previousBalance: 0,
			newBalance: 4,
			adjustment: 2,
		});
		expect(writes).toEqual([{ userId: "user-2", amount: 2, note: "Koreksi manual", fallbackBalanceAfter: 2 }]);
	});

	test("labels an unnoted reduction as an adjustment", async () => {
		const writes: Parameters<CreditRepository["applyCreditAdjustment"]>[0][] = [];
		const service = makeService(
			makeRepository({
				findUserCreditBalance: async () => ({ tryoutCredits: 5 }),
				applyCreditAdjustment: async (params) => {
					writes.push(params);
					return { newBalance: 3 };
				},
			}),
		);

		expect(await service.adjust({ userId: "user-2", amount: -2 })).toEqual({
			userId: "user-2",
			previousBalance: 5,
			newBalance: 3,
			adjustment: -2,
		});
		expect(writes).toEqual([{ userId: "user-2", amount: -2, note: "Admin adjustment", fallbackBalanceAfter: 3 }]);
	});
});

describe("credit service find", () => {
	test("reports a missing target user as NOT_FOUND with an Indonesian message", async () => {
		const service = makeService(makeRepository());

		try {
			await service.find({ userId: "missing" });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			expect(error).toHaveProperty("code", "NOT_FOUND");
			expect(error).toHaveProperty("message", "User tidak ditemukan");
		}
	});

	test("returns the user summary and their ledger history", async () => {
		const history = [
			{
				id: "entry-2",
				userId: "user-2",
				transactionId: null,
				tryoutAttemptId: null,
				amount: 1,
				balanceAfter: 6,
				note: "Admin grant",
				createdAt: new Date("2024-02-02"),
			},
			{
				id: "entry-1",
				userId: "user-2",
				transactionId: null,
				tryoutAttemptId: 12,
				amount: -1,
				balanceAfter: 5,
				note: "Used for tryout: Simulasi",
				createdAt: new Date("2024-02-01"),
			},
		];
		const service = makeService(
			makeRepository({
				findUserCreditSummary: async (userId) =>
					userId === "user-2"
						? { id: userId, name: "Anggota", email: "anggota@example.com", tryoutCredits: 6 }
						: undefined,
				listCreditHistory: async (userId) => (userId === "user-2" ? history : []),
			}),
		);

		expect(await service.find({ userId: "user-2" })).toEqual({
			user: { id: "user-2", name: "Anggota", email: "anggota@example.com", tryoutCredits: 6 },
			history,
		});
	});
});

describe("credit service packages", () => {
	const universe = Array.from({ length: 150 }, (_, index) => ({
		id: `p${(index + 1).toString().padStart(3, "0")}`,
		name: `Paket ${index + 1}`,
		slug: `paket-${index + 1}`,
		price: String(1000 + index),
		credits: index + 1,
	}));

	test("defaults to a forward page of twenty and signals the next page", async () => {
		const service = makeService(
			makeRepository({
				listCreditPackages: async ({ isBackward, limit }) =>
					(isBackward ? [...universe].reverse() : universe).slice(0, limit + 1),
			}),
		);

		const page = await service.packages(undefined);

		expect(page.items).toHaveLength(20);
		expect(page.items).toEqual(universe.slice(0, 20));
		expect(page.pageInfo).toEqual({
			hasNextPage: true,
			hasPreviousPage: false,
			startCursor: createStringIdCursor("p001"),
			endCursor: createStringIdCursor("p020"),
		});
	});

	test("caps oversized page requests at a hundred items", async () => {
		const service = makeService(
			makeRepository({
				listCreditPackages: async ({ isBackward, limit }) =>
					(isBackward ? [...universe].reverse() : universe).slice(0, limit + 1),
			}),
		);

		const page = await service.packages({ limit: 150 });

		expect(page.items).toHaveLength(100);
		expect(page.items).toEqual(universe.slice(0, 100));
		expect(page.pageInfo.hasNextPage).toBe(true);
	});

	test("travels backwards from a cursor", async () => {
		const service = makeService(
			makeRepository({
				listCreditPackages: async ({ isBackward, limit }) =>
					(isBackward ? [...universe].reverse() : universe).slice(0, limit + 1),
			}),
		);

		const page = await service.packages({ before: createStringIdCursor("p100") });

		expect(page.items).toEqual(universe.slice(130, 150));
		expect(page.pageInfo).toEqual({
			hasNextPage: true,
			hasPreviousPage: true,
			startCursor: createStringIdCursor("p131"),
			endCursor: createStringIdCursor("p150"),
		});
	});
});
