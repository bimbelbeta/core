import { db } from "@bimbelbeta/db";
import { calculatePurchaseBenefits } from "@/lib/transactions/benefits";
import { toPaymentErrorCode } from "@/lib/transactions/errors";
import { resolveNotificationOutcome } from "@/lib/transactions/notification-routing";
import { processSuccessfulTransaction } from "@/lib/transactions/processor";
import { midtransProvider } from "@/lib/transactions/providers/midtrans";
import { paymentRepository } from "@/lib/transactions/repository";
import type { PaymentStatus } from "@/lib/transactions/types";

const dependencies = {
	fetchStatus: midtransProvider.fetchStatus,
	find: paymentRepository.findTransactionWithProduct,
	updateStatus: paymentRepository.updateStatus,
	process: async (options: Omit<Parameters<typeof processSuccessfulTransaction>[0], "trx">) =>
		db.transaction((trx) => processSuccessfulTransaction({ ...options, trx })),
};

export const createNotificationService = (deps: typeof dependencies) => ({
	/**
	 * Handles one payment notification for an order.
	 *
	 * The gateway's claim is re-verified against the provider before anything is trusted, because a
	 * webhook body can be forged. The verified status is then turned into a single outcome: ignore
	 * unknown or already-paid orders, grant benefits, or record a non-success status.
	 *
	 * Granting benefits runs inside one transaction, so an order never ends up marked paid with only
	 * some of its credits or premium time applied. Two notifications for the same order can race:
	 * the processor claims the order atomically and only the winner grants benefits, so the loser
	 * reports `already_processed` instead of paying out twice.
	 *
	 * Never throws. Failures are reported as a status so the procedure decides which oRPC error to
	 * raise, and `verification_failed` keeps the payment error code in `reason` for logging.
	 *
	 * @param orderId Order id from the notification payload.
	 * @param purchaseDate Timestamp used as the paid-at time and the basis for premium expiry.
	 * @returns One of `ok`, `not_found`, `already_processed`, `user_deleted`, `verification_failed`
	 * (with `reason`), `processing_failed`, or `update_failed`.
	 */
	async process(orderId: string, purchaseDate: Date) {
		let status: PaymentStatus;
		try {
			status = await deps.fetchStatus(orderId);
		} catch (error) {
			return { status: "verification_failed", reason: toPaymentErrorCode(error) } as const;
		}

		const existingTransaction = await deps.find(orderId);
		const outcome = resolveNotificationOutcome(status, existingTransaction, purchaseDate, calculatePurchaseBenefits);

		if (outcome.action === "not_found" || outcome.action === "already_processed" || outcome.action === "user_deleted") {
			return { status: outcome.action } as const;
		}

		if (outcome.action === "process_success" && existingTransaction) {
			const applied = await deps
				.process({ orderId, userId: outcome.userId, existingTransaction, purchaseDate, benefits: outcome.benefits })
				.catch(() => null);
			if (applied === null) return { status: "processing_failed" } as const;
			if (!applied) return { status: "already_processed" } as const;
		} else if (outcome.action === "update_status") {
			const updated = await deps.updateStatus(orderId, outcome.status).then(
				() => true,
				() => false,
			);
			if (!updated) return { status: "update_failed" } as const;
		}

		return { status: "ok" } as const;
	},
});

export const notificationService = createNotificationService(dependencies);
