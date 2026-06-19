import { db } from "@bimbelbeta/db";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { eq } from "drizzle-orm";
import type { TransactionWithProduct } from "@/lib/transactions/types";

export async function fetchTransactionWithProduct(orderId: string): Promise<TransactionWithProduct | null> {
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
}
