import { describe, expect, test } from "bun:test";
import type { referralCode, referralUsage } from "@bimbelbeta/db/schema/referral";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { createStringIdCursor } from "@/lib/pagination/cursor";
import type { ReferralRepository } from "./repository";
import { createReferralService, type ReferralServiceDependencies } from "./service";

type ReferralCodeRow = typeof referralCode.$inferSelect;
type ReferralUsageRow = typeof referralUsage.$inferSelect;
type PremiumFields = { isPremium: boolean | null; premiumExpiresAt: Date | null };

const sessionUser: Session["user"] = {
	id: "user-1",
	name: "Pengguna",
	email: "user-1@example.com",
	emailVerified: false,
	image: null,
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
	role: "user",
	isPremium: false,
	premiumExpiresAt: null,
	tryoutCredits: 0,
	targetUniversityId: null,
	targetStudyProgramId: null,
};

function makeReferralCodeRow(overrides: Partial<ReferralCodeRow> = {}): ReferralCodeRow {
	return {
		id: "code-1",
		code: "PREMAAA",
		status: true,
		usageCount: 0,
		maxUsages: null,
		validUntil: null,
		premiumDays: 7,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		createdBy: null,
		...overrides,
	};
}

function makeState(
	codeOverrides: Partial<ReferralCodeRow> = {},
	premium: PremiumFields = { isPremium: false, premiumExpiresAt: null },
) {
	const usages: ReferralUsageRow[] = [];
	return {
		codes: [makeReferralCodeRow(codeOverrides)],
		usages,
		premium,
	};
}

function makeRepository(state: ReturnType<typeof makeState>) {
	const repository: ReferralRepository = {
		async lockCodeByCode(code: string) {
			return state.codes.find((row) => row.code === code);
		},
		async findUsage(userId: string, referralCodeId: string) {
			return state.usages.find((row) => row.userId === userId && row.referralCodeId === referralCodeId);
		},
		async findCodeByCode(code: string) {
			return state.codes.find((row) => row.code === code);
		},
		async insertCode(values: typeof referralCode.$inferInsert) {
			const inserted = makeReferralCodeRow(values);
			state.codes.push(inserted);
			return inserted;
		},
		async updateCodeStatus(codeId: string, status: boolean) {
			const row = state.codes.find((entry) => entry.id === codeId);
			if (!row) return undefined;
			row.status = status;
			return { id: row.id };
		},
		async deactivateCodes(codeIds: string[]) {
			for (const row of state.codes) {
				if (codeIds.includes(row.id)) row.status = false;
			}
		},
		async findCodeById(codeId: string) {
			return state.codes.find((row) => row.id === codeId);
		},
		async listUsages(query: { referralCodeId: string; limit: number; cursorId?: string; isBackward: boolean }) {
			const sorted = state.usages
				.filter((row) => row.referralCodeId === query.referralCodeId)
				.map((row) => ({
					usageId: row.id,
					claimedAt: row.createdAt,
					userId: row.userId,
					userName: sessionUser.name,
					userEmail: sessionUser.email,
					isPremium: state.premium.isPremium,
					premiumExpiresAt: state.premium.premiumExpiresAt,
				}))
				.sort((a, b) => (a.usageId < b.usageId ? -1 : 1));
			const cursorId = query.cursorId;
			const scoped = cursorId
				? query.isBackward
					? sorted.filter((row) => row.usageId < cursorId)
					: sorted.filter((row) => row.usageId > cursorId)
				: sorted;
			const ordered = query.isBackward ? scoped.slice().reverse() : scoped;
			return ordered.slice(0, query.limit + 1);
		},
		async listCodes(query: {
			limit: number;
			cursorId?: string;
			isBackward: boolean;
			search?: string;
			status?: boolean;
		}) {
			const matches = state.codes
				.filter((row) => (query.search ? row.code.toLowerCase().includes(query.search.toLowerCase()) : true))
				.filter((row) => (query.status !== undefined ? row.status === query.status : true))
				.sort((a, b) => (a.id < b.id ? -1 : 1));
			const cursorId = query.cursorId;
			const scoped = cursorId
				? query.isBackward
					? matches.filter((row) => row.id < cursorId)
					: matches.filter((row) => row.id > cursorId)
				: matches;
			const ordered = query.isBackward ? scoped.slice().reverse() : scoped;
			return ordered.slice(0, query.limit + 1);
		},
		async recordUsage(values: ReferralUsageRow) {
			state.usages.push(values);
		},
		async incrementCodeUsageCount(codeId: string) {
			const row = state.codes.find((entry) => entry.id === codeId);
			if (row) row.usageCount += 1;
		},
		async findUserPremiumFields(userId: string) {
			return userId === sessionUser.id ? state.premium : undefined;
		},
		async grantPremium(userId: string, premiumExpiresAt: Date) {
			if (userId !== sessionUser.id) return;
			state.premium = { isPremium: true, premiumExpiresAt };
		},
		async transaction<T>(fn: (repository: ReferralRepository) => Promise<T>) {
			return fn(repository);
		},
	};

	return repository;
}

function makeService(state: ReturnType<typeof makeState>) {
	const repository = makeRepository(state);
	return createReferralService({ repository } satisfies ReferralServiceDependencies);
}

async function expectDomainError(promise: Promise<unknown>, expectedCode: string, message: string) {
	try {
		await promise;
		expect.unreachable();
	} catch (error) {
		expect(error).toBeInstanceOf(DomainError);
		expect(error).toHaveProperty("code", expectedCode);
		expect(error).toHaveProperty("message", message);
	}
}

const DAY_MS = 24 * 60 * 60 * 1000;

describe("create", () => {
	test("rejects a code that already exists", async () => {
		const service = makeService(makeState());
		await expectDomainError(
			service.create({ premiumDays: 7, code: "PREMAAA" }, sessionUser),
			"UNPROCESSABLE_CONTENT",
			"Kode referal sudah digunakan. Gunakan kode lain.",
		);
	});

	test("returns the persisted code with the requester as its creator", async () => {
		const state = makeState();
		const service = makeService(state);

		const created = await service.create(
			{ code: "PREMBARU", premiumDays: 30, maxUsages: 5, validUntil: new Date("2027-01-01") },
			sessionUser,
		);

		expect(created).toMatchObject({
			id: created.id,
			code: "PREMBARU",
			premiumDays: 30,
			maxUsages: 5,
			createdBy: sessionUser.id,
		});
		expect(created?.id).toHaveLength(36);
	});

	test("generates a PREM-prefixed code and defaults quota and validity to null when absent", async () => {
		const state = makeState();
		const service = makeService(state);

		const created = await service.create({ premiumDays: 7 }, sessionUser);

		expect(created?.code).toMatch(/^PREM[A-Z0-9]{6}$/);
		expect(created?.maxUsages).toBe(null);
		expect(created?.validUntil).toBe(null);
		expect(created?.createdBy).toBe(sessionUser.id);
	});

	test("rejects a failed insert as an internal server error", async () => {
		const repository = {
			...makeRepository(makeState()),
			insertCode: async () => undefined,
		} satisfies ReferralRepository;
		const service = createReferralService({ repository } satisfies ReferralServiceDependencies);

		await expectDomainError(
			service.create({ premiumDays: 7, code: "PREMLAIN" }, sessionUser),
			"INTERNAL_SERVER_ERROR",
			"Gagal membuat kode referal.",
		);
	});
});

describe("updateStatus", () => {
	test("rejects an unknown code id with NOT_FOUND", async () => {
		const service = makeService(makeState());
		await expectDomainError(
			service.updateStatus({ codeId: "code-x", status: true }),
			"NOT_FOUND",
			"Kode referal tidak ditemukan.",
		);
	});

	test("activates a code and reports it", async () => {
		const state = makeState({ status: false });
		const service = makeService(state);

		const result = await service.updateStatus({ codeId: "code-1", status: true });

		expect(result.message).toBe("Kode referal berhasil diaktifkan.");
		expect(state.codes[0]?.status).toBe(true);
	});

	test("deactivates a code and reports it", async () => {
		const state = makeState();
		const service = makeService(state);

		const result = await service.updateStatus({ codeId: "code-1", status: false });

		expect(result.message).toBe("Kode referal berhasil dinonaktifkan.");
		expect(state.codes[0]?.status).toBe(false);
	});
});

describe("bulkDeactivate", () => {
	test("rejects an empty selection", async () => {
		const service = makeService(makeState());
		await expectDomainError(
			service.bulkDeactivate({ codeIds: [] }),
			"UNPROCESSABLE_CONTENT",
			"Tidak ada kode yang dipilih.",
		);
	});

	test("deactivates every selected code and reports the count", async () => {
		const state = makeState();
		state.codes.push(makeReferralCodeRow({ id: "code-2", code: "PREMBBB" }));
		const service = makeService(state);

		const result = await service.bulkDeactivate({ codeIds: ["code-1", "code-2"] });

		expect(result.message).toBe("2 kode referal berhasil dinonaktifkan.");
		expect(state.codes.every((row) => !row.status)).toBe(true);
	});
});

function addUsage(state: ReturnType<typeof makeState>, id: string) {
	state.usages.push({
		id,
		userId: sessionUser.id,
		referralCodeId: "code-1",
		createdAt: new Date("2026-01-02"),
	});
	return state;
}

describe("getUsages", () => {
	test("rejects an unknown code id with NOT_FOUND", async () => {
		const service = makeService(makeState());
		await expectDomainError(service.getUsages({ codeId: "code-x" }), "NOT_FOUND", "Kode referal tidak ditemukan.");
	});

	test("returns the code with its claimed usages as a cursor page", async () => {
		const state = addUsage(addUsage(makeState(), "usage-2"), "usage-1");
		const service = makeService(state);

		const result = await service.getUsages({ codeId: "code-1" });

		expect(result.referralCode.code).toBe("PREMAAA");
		expect(result.items.map((item) => item.usageId)).toEqual(["usage-1", "usage-2"]);
		expect(result.pageInfo.hasNextPage).toBe(false);
		expect(result.pageInfo.hasPreviousPage).toBe(false);
		expect(result.pageInfo.startCursor).toBe(createStringIdCursor("usage-1"));
		expect(result.pageInfo.endCursor).toBe(createStringIdCursor("usage-2"));
		expect(result.items[0]).toMatchObject({
			claimedAt: new Date("2026-01-02"),
			userId: sessionUser.id,
			userName: sessionUser.name,
			userEmail: sessionUser.email,
		});
	});

	test("marks a next page when more usages exist than the limit", async () => {
		const state = addUsage(addUsage(makeState(), "usage-2"), "usage-1");
		const service = makeService(state);

		const result = await service.getUsages({ codeId: "code-1", limit: 1 });

		expect(result.items.map((item) => item.usageId)).toEqual(["usage-1"]);
		expect(result.pageInfo.hasNextPage).toBe(true);
		expect(result.pageInfo.hasPreviousPage).toBe(false);
	});

	test("pages backwards from a before-cursor", async () => {
		const state = addUsage(addUsage(addUsage(makeState(), "usage-3"), "usage-2"), "usage-1");
		const service = makeService(state);

		const result = await service.getUsages({ codeId: "code-1", before: createStringIdCursor("usage-3"), limit: 1 });

		expect(result.items.map((item) => item.usageId)).toEqual(["usage-2"]);
		expect(result.pageInfo.hasNextPage).toBe(true);
		expect(result.pageInfo.hasPreviousPage).toBe(true);
		expect(result.pageInfo.startCursor).toBe(createStringIdCursor("usage-2"));
		expect(result.pageInfo.endCursor).toBe(createStringIdCursor("usage-2"));
	});
});

describe("list", () => {
	function makeCodes(count: number, overrides: Partial<ReferralCodeRow> = {}) {
		return Array.from({ length: count }, (_, index) =>
			makeReferralCodeRow({ id: `code-${String.fromCharCode(97 + index)}`, code: `PREM${index}`, ...overrides }),
		);
	}

	test("returns codes as a cursor page", async () => {
		const state = makeState();
		state.codes = makeCodes(3);
		const service = makeService(state);

		const result = await service.list({});

		expect(result.items.map((item) => item.id)).toEqual(["code-a", "code-b", "code-c"]);
		expect(result.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: createStringIdCursor("code-a"),
			endCursor: createStringIdCursor("code-c"),
		});
	});

	test("scopes the listing by search and active status", async () => {
		const state = makeState();
		state.codes = [
			...makeCodes(1, { code: "PREMAAA" }),
			...makeCodes(1, { id: "code-x", code: "PREMBBB", status: false }),
			...makeCodes(1, { id: "code-z", code: "OTHERCCC" }),
		];
		const service = makeService(state);

		const result = await service.list({ search: "aa", status: true });

		expect(result.items.map((item) => item.code)).toEqual(["PREMAAA"]);
	});

	test("caps the page size at a hundred codes", async () => {
		const state = makeState();
		state.codes = makeCodes(102);
		const service = makeService(state);

		const result = await service.list({ limit: 500 });

		expect(result.items).toHaveLength(100);
		expect(result.pageInfo.hasNextPage).toBe(true);
	});

	test("pages backwards from a before-cursor", async () => {
		const state = makeState();
		state.codes = makeCodes(4);
		const service = makeService(state);

		const result = await service.list({ before: createStringIdCursor("code-d"), limit: 2 });

		expect(result.items.map((item) => item.id)).toEqual(["code-b", "code-c"]);
		expect(result.pageInfo).toEqual({
			hasNextPage: true,
			hasPreviousPage: true,
			startCursor: createStringIdCursor("code-b"),
			endCursor: createStringIdCursor("code-c"),
		});
	});
});

describe("redeem", () => {
	test("rejects an unknown code with NOT_FOUND", async () => {
		const service = makeService(makeState());
		await expectDomainError(
			service.redeem({ code: "TIDAKADA" }, sessionUser),
			"NOT_FOUND",
			"Kode tidak ditemukan / salah.",
		);
	});

	test("rejects an inactive code", async () => {
		const service = makeService(makeState({ status: false }));
		await expectDomainError(
			service.redeem({ code: "PREMAAA" }, sessionUser),
			"UNPROCESSABLE_CONTENT",
			"Kode tidak valid atau sudah dinonaktifkan.",
		);
	});

	test("rejects an expired code", async () => {
		const service = makeService(makeState({ validUntil: new Date(Date.now() - 1) }));
		await expectDomainError(
			service.redeem({ code: "PREMAAA" }, sessionUser),
			"UNPROCESSABLE_CONTENT",
			"Kode sudah kedaluwarsa.",
		);
	});

	test("rejects a code whose quota is exhausted", async () => {
		const service = makeService(makeState({ maxUsages: 1, usageCount: 1 }));
		await expectDomainError(
			service.redeem({ code: "PREMAAA" }, sessionUser),
			"UNPROCESSABLE_CONTENT",
			"Kuota kode sudah habis.",
		);
	});

	test("rejects a second use by the same user", async () => {
		const state = makeState();
		state.usages.push({
			id: "usage-1",
			userId: sessionUser.id,
			referralCodeId: "code-1",
			createdAt: new Date("2026-01-01"),
		});
		const service = makeService(state);
		await expectDomainError(
			service.redeem({ code: "PREMAAA" }, sessionUser),
			"UNPROCESSABLE_CONTENT",
			"Anda sudah pernah menggunakan kode ini.",
		);
	});

	test("records the usage and grants premium for the exact code input regardless of casing", async () => {
		const startedAt = Date.now();
		const state = makeState();
		const service = makeService(state);

		const result = await service.redeem({ code: "premaaa" }, sessionUser);

		expect(state.usages).toHaveLength(1);
		expect(state.usages[0]?.userId).toBe(sessionUser.id);
		expect(state.usages[0]?.referralCodeId).toBe("code-1");
		expect(state.codes[0]?.usageCount).toBe(1);
		expect(state.premium.isPremium).toBe(true);

		const expiry = result.premiumExpiresAt.getTime();
		expect(expiry).toBeGreaterThan(startedAt + 7 * DAY_MS - 60_000);
		expect(expiry).toBeLessThan(startedAt + 7 * DAY_MS + 60_000);

		const expectedDate = result.premiumExpiresAt.toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
		expect(result.message).toBe(`Selamat! Akun Premium Anda aktif hingga ${expectedDate}.`);
	});

	test("extends an active premium from its current expiry", async () => {
		const currentExpiry = new Date(Date.now() + 30 * DAY_MS);
		const state = makeState({ premiumDays: 7 }, { isPremium: true, premiumExpiresAt: currentExpiry });
		const service = makeService(state);

		const result = await service.redeem({ code: "PREMAAA" }, sessionUser);

		expect(result.premiumExpiresAt.getTime()).toBe(currentExpiry.getTime() + 7 * DAY_MS);

		const expectedDate = result.premiumExpiresAt.toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
		expect(result.message).toBe(`Selamat! Akun Premium Anda aktif hingga ${expectedDate}.`);
	});
});
