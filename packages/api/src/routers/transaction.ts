import { db } from "@bimbelbeta/db";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import { and, eq } from "drizzle-orm";
import { authedNoPremiumImplementer } from "@/lib/router-definition";
import { baseImplementer } from "@/lib/router-definition/base";
import { notificationService } from "@/lib/transactions/notification.service";
import { subscriptionService } from "@/lib/transactions/subscription.service";
import { verifyMidtransSignature } from "@/lib/transactions/verification";

const pub = baseImplementer;
const authed = authedNoPremiumImplementer;

const subscribe = authed.transaction.subscribe.handler(async ({ input, context, errors }) => {
	const result = await subscriptionService.subscribe(input.slug, context.session.user);
	if (result.status === "not_found") throw errors.NOT_FOUND({ message: "Produk tidak ditemukan." });
	if (result.status === "already_premium")
		throw errors.UNPROCESSABLE_CONTENT({ message: "Kamu sudah menjadi member premium." });
	if (result.status === "creation_failed")
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat transaksi. Silahkan coba lagi." });
	if (result.status === "payment_failed")
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memproses pembayaran. Silahkan coba lagi." });
	return result.payment;
});

const notification = pub.transaction.notification.handler(async ({ input, errors }) => {
	const { order_id, status_code, gross_amount, signature_key } = input;
	const purchaseDate = new Date();

	if (!verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
		throw errors.UNAUTHORIZED({ message: "Invalid webhook signature." });
	}

	const result = await notificationService.process(order_id, purchaseDate);
	if (result.status === "verification_failed")
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memverifikasi status transaksi." });
	if (result.status === "processing_failed")
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memproses transaksi." });
	if (result.status === "update_failed")
		throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal memperbarui status transaksi." });

	return result;
});

const status = authed.transaction.status.handler(async ({ input, context, errors }) => {
	const tx = await db
		.select()
		.from(transaction)
		.where(and(eq(transaction.id, input.orderId), eq(transaction.userId, context.session.user.id)))
		.limit(1);

	if (!tx.length) {
		throw errors.NOT_FOUND({
			message: "Transaksi tidak ditemukan",
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
