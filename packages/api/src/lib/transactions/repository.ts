import { db } from "@bimbelbeta/db";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { and, eq, isNull } from "drizzle-orm";
import type { PaymentFailureCode } from "@/lib/transactions/failures";
import type { TransactionWithProduct } from "@/lib/transactions/types";

export const paymentRepository = {
	async findProduct(slug: string) {
		const [plan] = await db.select().from(product).where(eq(product.slug, slug)).limit(1);
		return plan;
	},

	async createTransaction(data: typeof transaction.$inferInsert) {
		const [created] = await db.insert(transaction).values(data).returning();
		return created;
	},

	async findTransactionWithProduct(orderId: string): Promise<TransactionWithProduct | null> {
		const [result] = await db
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

		return result || null;
	},

	async updateStatus(orderId: string, status: "failed" | "pending", failure?: PaymentFailureCode, detail?: string) {
		await db
			.update(transaction)
			.set({ status, failureCode: failure ?? null, failureDetail: detail ?? null })
			.where(and(eq(transaction.id, orderId), isNull(transaction.paidAt)));
	},
};
