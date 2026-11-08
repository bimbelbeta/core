import type { DbClient } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { referralCode, referralUsage } from "@bimbelbeta/db/schema/referral";
import { and, asc, desc, eq, gt, ilike, inArray, lt, sql } from "drizzle-orm";

export function createReferralRepository(client: DbClient) {
	return {
		async lockCodeByCode(code: string) {
			const [row] = await client.select().from(referralCode).where(eq(referralCode.code, code)).for("update").limit(1);
			return row;
		},
		async findCodeByCode(code: string) {
			const [row] = await client.select().from(referralCode).where(eq(referralCode.code, code)).limit(1);
			return row;
		},
		async findCodeById(codeId: string) {
			const [row] = await client.select().from(referralCode).where(eq(referralCode.id, codeId)).limit(1);
			return row;
		},
		async listUsages(query: { referralCodeId: string; limit: number; cursorId?: string; isBackward: boolean }) {
			return client
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
						eq(referralUsage.referralCodeId, query.referralCodeId),
						query.cursorId !== undefined
							? query.isBackward
								? lt(referralUsage.id, query.cursorId)
								: gt(referralUsage.id, query.cursorId)
							: undefined,
					),
				)
				.orderBy(query.isBackward ? desc(referralUsage.id) : asc(referralUsage.id))
				.limit(query.limit);
		},
		async insertCode(values: typeof referralCode.$inferInsert) {
			const [row] = await client.insert(referralCode).values(values).returning();
			return row;
		},
		async listCodes(query: {
			limit: number;
			cursorId?: string;
			isBackward: boolean;
			search?: string;
			status?: boolean;
		}) {
			return client
				.select()
				.from(referralCode)
				.where(
					and(
						query.cursorId !== undefined
							? query.isBackward
								? lt(referralCode.id, query.cursorId)
								: gt(referralCode.id, query.cursorId)
							: undefined,
						query.search ? ilike(referralCode.code, `%${query.search}%`) : undefined,
						query.status !== undefined ? eq(referralCode.status, query.status) : undefined,
					),
				)
				.orderBy(query.isBackward ? desc(referralCode.id) : asc(referralCode.id))
				.limit(query.limit);
		},
		async findUsage(userId: string, referralCodeId: string) {
			const [row] = await client
				.select({ id: referralUsage.id })
				.from(referralUsage)
				.where(and(eq(referralUsage.userId, userId), eq(referralUsage.referralCodeId, referralCodeId)))
				.limit(1);
			return row;
		},
		async recordUsage(values: typeof referralUsage.$inferInsert) {
			await client.insert(referralUsage).values(values);
		},
		async incrementCodeUsageCount(referralCodeId: string) {
			await client
				.update(referralCode)
				.set({ usageCount: sql`${referralCode.usageCount} + 1`, updatedAt: new Date() })
				.where(eq(referralCode.id, referralCodeId));
		},
		async findUserPremiumFields(userId: string) {
			const [row] = await client
				.select({ isPremium: user.isPremium, premiumExpiresAt: user.premiumExpiresAt })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return row;
		},
		async updateCodeStatus(codeId: string, status: boolean) {
			const [row] = await client
				.update(referralCode)
				.set({ status, updatedAt: new Date() })
				.where(eq(referralCode.id, codeId))
				.returning({ id: referralCode.id });
			return row;
		},
		async deactivateCodes(codeIds: string[]) {
			await client
				.update(referralCode)
				.set({ status: false, updatedAt: new Date() })
				.where(inArray(referralCode.id, codeIds));
		},
		async grantPremium(userId: string, premiumExpiresAt: Date) {
			await client
				.update(user)
				.set({ isPremium: true, premiumExpiresAt, updatedAt: new Date() })
				.where(eq(user.id, userId));
		},
	};
}

export type ReferralRepository = ReturnType<typeof createReferralRepository>;
