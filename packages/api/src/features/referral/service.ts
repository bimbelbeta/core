import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { buildStringIdCursorPage, decodeStringIdPage } from "@/lib/pagination/cursor";
import { createReferralRepository, type ReferralRepository } from "./repository";

export type ReferralServiceDependencies = {
	repository: ReferralRepository;
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
		if (existing) throw new DomainError("UNPROCESSABLE_CONTENT", "Kode referal sudah digunakan. Gunakan kode lain.");

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

	async list(input: {
		after?: string;
		before?: string;
		limit?: number;
		search?: string;
		status?: "aktif" | "nonaktif" | "kedaluwarsa" | "kuota_habis";
	}) {
		const { limit, backward, cursorId, hasCursor } = decodeStringIdPage(input);

		const filter = input.status
			? {
					aktif: { status: true, notExpired: true, hasQuota: true },
					nonaktif: { status: false },
					kedaluwarsa: { status: true, expired: true },
					kuota_habis: { status: true, quotaReached: true },
				}[input.status]
			: undefined;

		const [rows, totalCount] = await Promise.all([
			deps.repository.listCodes({
				limit,
				cursorId,
				isBackward: backward,
				search: input.search,
				filter,
			}),
			deps.repository.countCodes({ search: input.search, filter }),
		]);

		const { items, pageInfo } = buildStringIdCursorPage(rows, limit, backward, hasCursor);

		return { items, pageInfo: { ...pageInfo, totalCount } };
	},

	async updateStatus(input: { codeId: string; status: boolean }) {
		const updated = await deps.repository.updateCodeStatus(input.codeId, input.status);
		if (!updated) throw new DomainError("NOT_FOUND", "Kode referal tidak ditemukan.");

		return { message: `Kode referal berhasil ${input.status ? "diaktifkan" : "dinonaktifkan"}.` };
	},

	async bulkDeactivate(input: { codeIds: string[] }) {
		if (input.codeIds.length === 0) throw new DomainError("UNPROCESSABLE_CONTENT", "Tidak ada kode yang dipilih.");

		await deps.repository.deactivateCodes(input.codeIds);

		return { message: `${input.codeIds.length} kode referal berhasil dinonaktifkan.` };
	},

	async getUsages(input: { codeId: string; after?: string; before?: string; limit?: number }) {
		const codeData = await deps.repository.findCodeById(input.codeId);
		if (!codeData) throw new DomainError("NOT_FOUND", "Kode referal tidak ditemukan.");

		const { limit, backward, cursorId, hasCursor } = decodeStringIdPage(input);

		const rows = await deps.repository.listUsages({
			referralCodeId: input.codeId,
			limit,
			cursorId,
			isBackward: backward,
		});

		const { items, pageInfo } = buildStringIdCursorPage(rows, limit, backward, hasCursor, "usageId");

		return { referralCode: codeData, items, pageInfo };
	},

	async redeem(input: { code: string }, user: Session["user"]) {
		const code = input.code.toUpperCase();

		return deps.repository.transaction(async (repository) => {
			const codeRow = await repository.lockCodeByCode(code);
			if (!codeRow) throw new DomainError("NOT_FOUND", "Kode tidak ditemukan / salah.");

			if (!codeRow.status) throw new DomainError("UNPROCESSABLE_CONTENT", "Kode tidak valid atau sudah dinonaktifkan.");

			if (codeRow.validUntil && codeRow.validUntil < new Date())
				throw new DomainError("UNPROCESSABLE_CONTENT", "Kode sudah kedaluwarsa.");

			if (codeRow.maxUsages !== null && codeRow.usageCount >= codeRow.maxUsages) {
				throw new DomainError("UNPROCESSABLE_CONTENT", "Kuota kode sudah habis.");
			}

			const existingUsage = await repository.findUsage(user.id, codeRow.id);
			if (existingUsage) throw new DomainError("UNPROCESSABLE_CONTENT", "Anda sudah pernah menggunakan kode ini.");

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
				premiumDays: codeRow.premiumDays,
			};
		});
	},
});

const dependencies = {
	repository: createReferralRepository(db),
} satisfies ReferralServiceDependencies;

export const referralService = createReferralService(dependencies);
