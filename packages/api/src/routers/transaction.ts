import { db } from "@bimbelbeta/db";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import { and, eq } from "drizzle-orm";
import { authed, pub } from "../index";
import { calculatePurchaseBenefits } from "../lib/transactions/benefits";
import { createSubscriptionTransaction } from "../lib/transactions/client";
import { resolveNotificationOutcome } from "../lib/transactions/notification-routing";
import { processSuccessfulTransaction } from "../lib/transactions/processor";
import { fetchTransactionWithProduct } from "../lib/transactions/products";
import { updateTransactionStatus } from "../lib/transactions/status";
import { verifyMidtransSignature, verifyMidtransTransaction } from "../lib/transactions/verification";

const subscribe = authed.transaction.subscribe.handler(async ({ input, context, errors }) => {
	const [plan] = await db.select().from(product).where(eq(product.slug, input.slug)).limit(1);
	if (!plan) throw errors.NOT_FOUND({ message: "Produk tidak ditemukan." });

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
	}).catch(() => {
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memproses pembayaran. Silahkan coba lagi." });
	});
});

const notification = pub.transaction.notification.handler(async ({ input, errors }) => {
	const { order_id, status_code, gross_amount, signature_key } = input;
	const purchaseDate = new Date();

	if (!verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
		throw errors.UNAUTHORIZED({ message: "Invalid webhook signature." });
	}

	const { transaction_status: transactionStatus, fraud_status: fraudStatus } = await verifyMidtransTransaction(
		order_id,
	).catch(() => {
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memverifikasi status transaksi." });
	});

	const existingTransaction = await fetchTransactionWithProduct(order_id);

	const outcome = resolveNotificationOutcome(
		transactionStatus,
		fraudStatus,
		existingTransaction,
		purchaseDate,
		calculatePurchaseBenefits,
	);

	if (outcome.action === "not_found") {
		return { status: "not_found" };
	}

	if (outcome.action === "already_processed") {
		return { status: "already_processed" };
	}

	if (outcome.action === "user_deleted") {
		return { status: "user_deleted" };
	}

	if (outcome.action === "process_success") {
		await db
			.transaction(async (trx) => {
				await processSuccessfulTransaction({
					trx,
					orderId: order_id,
					userId: outcome.userId,
					existingTransaction: existingTransaction!,
					purchaseDate,
					benefits: outcome.benefits,
				});
			})
			.catch(() => {
				throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memproses transaksi." });
			});
	} else if (outcome.action === "update_status") {
		await updateTransactionStatus(order_id, outcome.status).catch(() => {
			throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memperbarui status transaksi." });
		});
	}

	return { status: "ok" };
});

const status = authed.transaction.status.handler(async ({ input, context, errors }) => {
	const tx = await db
		.select()
		.from(transaction)
		.where(and(eq(transaction.id, input.orderId), eq(transaction.userId, context.session.user.id)))
		.limit(1);

	if (!tx.length) {
		throw errors.NOT_FOUND({
			message: "Transaction not found",
		});
	}

	const row = tx[0]!;
	return {
		status: row.status,
		paidAt: row.paidAt?.toISOString() ?? null,
	};
});

export const transactionRouter = {
	subscribe,
	notification,
	status,
};
