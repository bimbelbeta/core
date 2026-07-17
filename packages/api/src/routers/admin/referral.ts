import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { referralCode, referralUsage } from "@bimbelbeta/db/schema/referral";
import { and, asc, desc, eq, gt, ilike, inArray, lt } from "drizzle-orm";
import { buildStringIdCursorPage, parseStringIdCursor } from "@/lib/pagination/cursor";
import { superAdminImplementer } from "@/lib/router-definition";

const superadmin = superAdminImplementer;

function generateAlphanumericId(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
	return `PREM${randomPart}`;
}

const list = superadmin.admin.referral.list.handler(async ({ input }) => {
	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursor = input.before || input.after;
	const cursorId = cursor ? parseStringIdCursor(cursor) : undefined;

	const rows = await db
		.select()
		.from(referralCode)
		.where(
			and(
				cursorId !== undefined
					? isBackward
						? lt(referralCode.id, cursorId)
						: gt(referralCode.id, cursorId)
					: undefined,
				input.search ? ilike(referralCode.code, `%${input.search}%`) : undefined,
				input.status !== undefined ? eq(referralCode.status, input.status) : undefined,
			),
		)
		.orderBy(isBackward ? desc(referralCode.id) : asc(referralCode.id))
		.limit(limit + 1);

	const { items, pageInfo } = buildStringIdCursorPage(rows, limit, isBackward, !!cursor);

	return { items, pageInfo };
});

const create = superadmin.admin.referral.create.handler(async ({ input, context, errors }) => {
	const code = input.code ?? generateAlphanumericId();

	const existing = await db
		.select({ id: referralCode.id })
		.from(referralCode)
		.where(eq(referralCode.code, code))
		.limit(1);
	if (existing.length > 0) {
		throw errors.UNPROCESSABLE_CONTENT({ message: "Kode referal sudah digunakan. Gunakan kode lain." });
	}

	const id = crypto.randomUUID();

	const [created] = await db
		.insert(referralCode)
		.values({
			id,
			code,
			premiumDays: input.premiumDays,
			maxUsages: input.maxUsages ?? null,
			validUntil: input.validUntil ?? null,
			createdBy: context.session.user.id,
		})
		.returning();

	if (!created) {
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat kode referal." });
	}

	return created;
});

const updateStatus = superadmin.admin.referral.updateStatus.handler(async ({ input, errors }) => {
	const result = await db
		.update(referralCode)
		.set({ status: input.status, updatedAt: new Date() })
		.where(eq(referralCode.id, input.codeId))
		.returning({ id: referralCode.id });

	if (result.length === 0) {
		throw errors.NOT_FOUND({ message: "Kode referal tidak ditemukan." });
	}

	return { message: `Kode referal berhasil ${input.status ? "diaktifkan" : "dinonaktifkan"}.` };
});

const bulkDeactivate = superadmin.admin.referral.bulkDeactivate.handler(async ({ input, errors }) => {
	if (input.codeIds.length === 0) {
		throw errors.UNPROCESSABLE_CONTENT({ message: "Tidak ada kode yang dipilih." });
	}

	await db
		.update(referralCode)
		.set({ status: false, updatedAt: new Date() })
		.where(inArray(referralCode.id, input.codeIds));

	return { message: `${input.codeIds.length} kode referal berhasil dinonaktifkan.` };
});

const getUsages = superadmin.admin.referral.getUsages.handler(async ({ input, errors }) => {
	const [codeData] = await db.select().from(referralCode).where(eq(referralCode.id, input.codeId)).limit(1);

	if (!codeData) {
		throw errors.NOT_FOUND({ message: "Kode referal tidak ditemukan." });
	}

	const limit = Math.min(input.limit ?? 20, 100);
	const isBackward = !!input.before;
	const cursor = input.before || input.after;
	const cursorId = cursor ? parseStringIdCursor(cursor) : undefined;

	const rows = await db
		.select({
			usageId: referralUsage.id,
			claimedAt: referralUsage.createdAt,
			userId: user.id,
			userName: user.name,
			userEmail: user.email,
			isPremium: user.isPremium,
			premiumExpiresAt: user.premiumExpiresAt,
		})
		.from(referralUsage)
		.innerJoin(user, eq(referralUsage.userId, user.id))
		.where(
			and(
				eq(referralUsage.referralCodeId, input.codeId),
				cursorId !== undefined
					? isBackward
						? lt(referralUsage.id, cursorId)
						: gt(referralUsage.id, cursorId)
					: undefined,
			),
		)
		.orderBy(isBackward ? desc(referralUsage.id) : asc(referralUsage.id))
		.limit(limit + 1);

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
			startCursor: firstItem ? Buffer.from(firstItem.usageId).toString("base64url") : null,
			endCursor: lastItem ? Buffer.from(lastItem.usageId).toString("base64url") : null,
		},
	};
});

export const adminReferralRouter = {
	list,
	create,
	updateStatus,
	bulkDeactivate,
	getUsages,
};
