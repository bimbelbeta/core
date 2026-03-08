import { db } from "@bimbelbeta/db";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";

import { type } from "arktype";
import { eq } from "drizzle-orm";
import { authed, pub } from "..";
import { createSubscriptionTransaction } from "../lib/midtrans";
import {
	calculatePurchaseBenefits,
	fetchTransactionWithProduct,
	processSuccessfulTransaction,
	updateTransactionStatus,
	verifyMidtransTransaction,
} from "../lib/transaction-helpers";

const subscribe = authed
	.route({
		path: "/subscribe",
		method: "POST",
		tags: ["Payment", "Subscription"],
	})
	.input(
		type({
			slug: "string",
		}),
	)
	.output(
		type({
			token: "string",
			redirectUrl: "string",
		}),
	)
	.handler(async ({ input, context, errors }) => {
		const [plan] = await db.select().from(product).where(eq(product.slug, input.slug)).limit(1);
		if (!plan) throw errors.NOT_FOUND({ message: "Produk tidak ditemukan." });

		// Check if user already has an active premium subscription
		// This applies to both fixed_date and monthly variants
		if (plan.variant === "fixed_date" || plan.variant === "monthly") {
			if (context.session.user.isPremium)
				throw errors.UNPROCESSABLE_CONTENT({ message: "Kamu sudah menjadi member premium." });
		}

		const grossAmount = plan.price;
		const orderId = `tx_${crypto.randomUUID()}`;

		const [createdTransaction] = await db
			.insert(transaction)
			.values({
				id: orderId,
				productId: plan.id,
				grossAmount: String(grossAmount),
				userId: context.session.user.id,
			})
			.returning();
		if (!createdTransaction)
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat transaksi. Silahkan coba lagi." });

		return await createSubscriptionTransaction({
			id: orderId,
			session: context.session,
			name: plan.name,
			price: plan.price,
		});
	});

const notification = pub
	.route({
		path: "/transactions/notification",
		method: "POST",
		tags: ["Payment", "Webhook"],
	})
	.input(type({} as Record<string, unknown>))
	.handler(async ({ input }) => {
		const { order_id } = input as { order_id: string };
		const purchaseDate = new Date();

		// Verify transaction status with Midtrans
		const { transaction_status: transactionStatus, fraud_status: fraudStatus } =
			await verifyMidtransTransaction(order_id);

		// Fetch transaction with product details
		const existingTransaction = await fetchTransactionWithProduct(order_id);
		if (!existingTransaction) {
			console.error(`Transaction not found for order ID: ${order_id}`);
			return { status: "not_found" };
		}

		const tx = existingTransaction.tx;

		// Check if already processed
		if (tx.paidAt) {
			console.log(`Transaction ${order_id} already processed`);
			return { status: "already_processed" };
		}

		// Calculate benefits based on product variant
		const benefits = calculatePurchaseBenefits(existingTransaction, purchaseDate);

		// Handle transaction status
		if (transactionStatus === "capture" || transactionStatus === "settlement") {
			const isValid = transactionStatus === "capture" ? fraudStatus === "accept" : true;

			if (isValid) {
				await db.transaction(async (trx) => {
					await processSuccessfulTransaction(trx, order_id, tx.userId!, existingTransaction, purchaseDate, benefits);
				});
			}
		} else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
			await updateTransactionStatus(order_id, "failed");
		} else if (transactionStatus === "pending") {
			await updateTransactionStatus(order_id, "pending");
		}

		return { status: "ok" };
	});

const getStatus = authed
	.route({
		path: "/transactions/status",
		method: "GET",
		tags: ["Payment"],
	})
	.input(type({ orderId: "string" }))
	.handler(async ({ input, errors }) => {
		const tx = await db.select().from(transaction).where(eq(transaction.id, input.orderId)).limit(1);

		if (!tx.length) {
			throw errors.NOT_FOUND({
				message: "Transaction not found",
			});
		}

		const row = tx[0]!;
		return {
			status: row.status,
			paidAt: row.paidAt,
		};
	});

export const transactionRouter = {
	subscribe,
	notification,
	getStatus,
};
