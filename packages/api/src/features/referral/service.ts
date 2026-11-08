import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { buildStringIdCursorPage, createStringIdCursor, parseStringIdCursor } from "@/lib/pagination/cursor";
import { createReferralRepository, type ReferralRepository } from "./repository";

export type ReferralServiceDependencies = {
	repository: ReferralRepository;
	runInTransaction: <T>(fn: (repository: ReferralRepository) => Promise<T>) => Promise<T>;
};

function generateReferralCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
	return `PREM${randomPart}`;
}

export const createReferralService = (deps: ReferralServiceDependencies) => ({
	async create(
		input: { code?: string; premiumDays: number; maxUsages?: number | null; validUntil?: Date | null },
		user: Session["user"],
	) {
		const code = input.code ?? generateReferralCode();

		const existing = await deps.repository.findCodeByCode(code);
		if (existing) throw new DomainError("BAD_REQUEST", "Kode referal sudah digunakan. Gunakan kode lain.");

		const id = crypto.randomUUID();
		const created = await deps.repository.insertCode({
			id,
			code,
			premiumDays: input.premiumDays,
			maxUsages: input.maxUsages ?? null,
			validUntil: input.validUntil ?? null,
			createdBy: user.id,
		});

		if (!created) throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat kode referal.");

		return created;
	},

	async list(input: { after?: string; before?: string; limit?: number; search?: string; status?: boolean }) {
		const limit = Math.min(input.limit ?? 20, 100);
		const isBackward = !!input.before;
		const cursor = input.before || input.after;
		const cursorId = cursor ? parseStringIdCursor(cursor) : undefined;

		const rows = await deps.repository.listCodes({
			limit: limit + 1,
			cursorId,
			isBackward,
			search: input.search,
			status: input.status,
		});

		const { items, pageInfo } = buildStringIdCursorPage(rows, limit, isBackward, !!cursor);

		return { items, pageInfo };
	},

	async updateStatus(input: { codeId: string; status: boolean }) {
		const updated = await deps.repository.updateCodeStatus(input.codeId, input.status);
		if (!updated) throw new DomainError("NOT_FOUND", "Kode referal tidak ditemukan.");

		return { message: `Kode referal berhasil ${input.status ? "diaktifkan" : "dinonaktifkan"}.` };
	},

	async bulkDeactivate(input: { codeIds: string[] }) {
		if (input.codeIds.length === 0) throw new DomainError("BAD_REQUEST", "Tidak ada kode yang dipilih.");

		await deps.repository.deactivateCodes(input.codeIds);

		return { message: `${input.codeIds.length} kode referal berhasil dinonaktifkan.` };
	},

	async getUsages(input: { codeId: string; after?: string; before?: string; limit?: number }) {
		const codeData = await deps.repository.findCodeById(input.codeId);
		if (!codeData) throw new DomainError("NOT_FOUND", "Kode referal tidak ditemukan.");

		const limit = Math.min(input.limit ?? 20, 100);
		const isBackward = !!input.before;
		const cursor = input.before || input.after;
		const cursorId = cursor ? parseStringIdCursor(cursor) : undefined;

		const rows = await deps.repository.listUsages({
			referralCodeId: input.codeId,
			limit: limit + 1,
			cursorId,
			isBackward,
		});

		const hasExtra = rows.length > limit;
		let items = hasExtra ? rows.slice(0, limit) : rows;
		if (isBackward) items = items.slice().reverse();

		const firstItem = items[0];
		const lastItem = items[items.length - 1];

		return {
			referralCode: codeData,
			items,
			pageInfo: {
				hasNextPage: isBackward ? !!cursor : hasExtra,
				hasPreviousPage: isBackward ? hasExtra : !!cursor,
				startCursor: firstItem ? createStringIdCursor(firstItem.usageId) : null,
				endCursor: lastItem ? createStringIdCursor(lastItem.usageId) : null,
			},
		};
	},

	async redeem(input: { code: string }, user: Session["user"]) {
		const code = input.code.toUpperCase();

		return deps.runInTransaction(async (repository) => {
			const codeRow = await repository.lockCodeByCode(code);
			if (!codeRow) throw new DomainError("NOT_FOUND", "Kode tidak ditemukan / salah.");

			if (!codeRow.status) throw new DomainError("BAD_REQUEST", "Kode tidak valid atau sudah dinonaktifkan.");

			if (codeRow.validUntil && codeRow.validUntil < new Date())
				throw new DomainError("BAD_REQUEST", "Kode sudah kedaluwarsa.");

			if (codeRow.maxUsages !== null && codeRow.usageCount >= codeRow.maxUsages) {
				throw new DomainError("BAD_REQUEST", "Kuota kode sudah habis.");
			}

			const existingUsage = await repository.findUsage(user.id, codeRow.id);
			if (existingUsage) throw new DomainError("BAD_REQUEST", "Anda sudah pernah menggunakan kode ini.");

			const id = crypto.randomUUID();
			await repository.recordUsage({ id, userId: user.id, referralCodeId: codeRow.id });

			await repository.incrementCodeUsageCount(codeRow.id);

			const currentUser = await repository.findUserPremiumFields(user.id);

			const now = new Date();
			const baseDate =
				currentUser?.isPremium && currentUser.premiumExpiresAt && currentUser.premiumExpiresAt > now
					? currentUser.premiumExpiresAt
					: now;

			const newPremiumExpiresAt = new Date(baseDate.getTime() + codeRow.premiumDays * 24 * 60 * 60 * 1000);

			await repository.grantPremium(user.id, newPremiumExpiresAt);

			const claimedDate = newPremiumExpiresAt.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});

			return {
				message: `Selamat! Akun Premium Anda aktif hingga ${claimedDate}.`,
				premiumExpiresAt: newPremiumExpiresAt,
			};
		});
	},
});

const dependencies = {
	repository: createReferralRepository(db),
	runInTransaction: <T>(fn: (repository: ReferralRepository) => Promise<T>) =>
		db.transaction(async (tx) => fn(createReferralRepository(tx))),
} satisfies ReferralServiceDependencies;

export const referralService = createReferralService(dependencies);
