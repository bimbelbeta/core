import type { DbClient } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { product } from "@bimbelbeta/db/schema/transaction";
import { and, asc, desc, eq, gt, isNotNull, lt, sql } from "drizzle-orm";

export const createCreditRepository = (db: DbClient) => {
	async function transaction<T>(fn: (repository: CreditRepository) => Promise<T>): Promise<T> {
		return await db.transaction((tx) => fn(createCreditRepository(tx)));
	}

	return {
		async findUserCreditBalance(userId: string) {
			const [row] = await db
				.select({ tryoutCredits: user.tryoutCredits })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return row;
		},

		async listCreditPackages({
			cursorId,
			isBackward,
			limit,
		}: {
			cursorId: string | null;
			isBackward: boolean;
			limit: number;
		}) {
			return db
				.select({
					id: product.id,
					name: product.name,
					slug: product.slug,
					price: product.price,
					credits: product.credits,
				})
				.from(product)
				.where(
					and(
						eq(product.type, "product"),
						isNotNull(product.credits),
						cursorId !== null ? (isBackward ? lt(product.id, cursorId) : gt(product.id, cursorId)) : undefined,
					),
				)
				.orderBy(isBackward ? desc(product.id) : asc(product.id))
				.limit(limit + 1);
		},

		async findUserCreditSummary(userId: string) {
			const [row] = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					tryoutCredits: user.tryoutCredits,
				})
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return row;
		},

		async listCreditHistory(userId: string) {
			return db
				.select()
				.from(creditTransaction)
				.where(eq(creditTransaction.userId, userId))
				.orderBy(desc(creditTransaction.createdAt))
				.limit(50);
		},

		async applyCreditAdjustment({
			userId,
			amount,
			note,
			fallbackBalanceAfter,
		}: {
			userId: string;
			amount: number;
			note: string;
			fallbackBalanceAfter: number;
		}) {
			const [updated] = await db
				.update(user)
				.set({ tryoutCredits: sql`${user.tryoutCredits} + ${amount}` })
				.where(eq(user.id, userId))
				.returning({ tryoutCredits: user.tryoutCredits });

			const newBalance = updated?.tryoutCredits ?? fallbackBalanceAfter;

			await db.insert(creditTransaction).values({
				userId,
				amount,
				balanceAfter: newBalance,
				note,
			});

			return { newBalance };
		},

		async deductCreditForTryoutAttempt({
			userId,
			tryoutAttemptId,
			note,
		}: {
			userId: string;
			tryoutAttemptId: number;
			note: string;
		}) {
			const [updated] = await db
				.update(user)
				.set({ tryoutCredits: sql`COALESCE(${user.tryoutCredits}, 0) - 1` })
				.where(eq(user.id, userId))
				.returning({ tryoutCredits: user.tryoutCredits });

			const balanceAfter = updated?.tryoutCredits ?? 0;

			await db.insert(creditTransaction).values({
				userId,
				tryoutAttemptId,
				amount: -1,
				balanceAfter,
				note,
			});

			return { balanceAfter };
		},

		transaction,
	};
};

export type CreditRepository = ReturnType<typeof createCreditRepository>;
