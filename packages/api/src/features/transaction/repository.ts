import type { DbClient } from "@bimbelbeta/db";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { PaymentFailureCode } from "./failures";
import type { Settlement, TransactionWithProduct } from "./types";

export type TransactionRow = typeof transaction.$inferSelect;
export type TransactionInsert = typeof transaction.$inferInsert;

export function createTransactionRepository(client: DbClient) {
	async function findForMember(orderId: string, userId: string): Promise<TransactionRow | undefined> {
		const [row] = await client
			.select()
			.from(transaction)
			.where(and(eq(transaction.id, orderId), eq(transaction.userId, userId)))
			.limit(1);
		return row;
	}

	async function createTransaction(data: TransactionInsert): Promise<TransactionRow | undefined> {
		const [row] = await client.insert(transaction).values(data).returning();
		return row;
	}

	async function findTransactionWithProduct(orderId: string): Promise<TransactionWithProduct | undefined> {
		const [row] = await client
			.select({
				tx: transaction,
				prodSlug: product.slug,
				prodVariant: product.variant,
				prodFixedExpiryMonth: product.fixedExpiryMonth,
				prodFixedExpiryDay: product.fixedExpiryDay,
				prodDurationDays: product.durationDays,
				prodCredits: product.credits,
			})
			.from(transaction)
			.innerJoin(product, eq(transaction.productId, product.id))
			.where(eq(transaction.id, orderId))
			.limit(1);

		return row;
	}

	async function updateStatus(
		orderId: string,
		update: { status: "failed" | "pending"; failure?: PaymentFailureCode; detail?: string } & Settlement,
	) {
		await client
			.update(transaction)
			.set({
				status: update.status,
				failureCode: update.failure ?? null,
				failureDetail: update.detail ?? null,
				...(update.providerTransactionId ? { providerTransactionId: update.providerTransactionId } : {}),
				...(update.amountPaid ? { amountPaid: update.amountPaid } : {}),
				...(update.paymentMethod ? { paymentMethod: update.paymentMethod } : {}),
			})
			.where(and(eq(transaction.id, orderId), isNull(transaction.paidAt)));
	}

	async function failExpiredPending(now: Date): Promise<number> {
		const rows = await client
			.update(transaction)
			.set({ status: "failed", failureCode: "payment_expired", failureDetail: "Pembayaran kedaluwarsa." })
			.where(and(eq(transaction.status, "pending"), lt(transaction.expiresAt, now), isNull(transaction.paidAt)))
			.returning({ id: transaction.id });
		return rows.length;
	}

	async function sumSuccessfulGrossSince(since: Date, untilBefore?: Date): Promise<{ total: number } | undefined> {
		const [row] = await client
			.select({
				total: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)`,
			})
			.from(transaction)
			.where(
				and(
					eq(transaction.status, "success"),
					gte(transaction.paidAt, since),
					untilBefore ? lt(transaction.paidAt, untilBefore) : undefined,
				),
			);
		return row;
	}

	async function claimOrder(
		orderId: string,
		{ purchaseDate, settlement }: { purchaseDate: Date; settlement: Settlement },
	): Promise<boolean> {
		const claimed = await client
			.update(transaction)
			.set({ status: "success", paidAt: purchaseDate, ...settlement })
			.where(and(eq(transaction.id, orderId), isNull(transaction.paidAt)))
			.returning({ id: transaction.id });

		return claimed.length > 0;
	}

	return {
		findForMember,
		createTransaction,
		findTransactionWithProduct,
		updateStatus,
		failExpiredPending,
		sumSuccessfulGrossSince,
		claimOrder,
	};
}

export type TransactionRepository = ReturnType<typeof createTransactionRepository>;
