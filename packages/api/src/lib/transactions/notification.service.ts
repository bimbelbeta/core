import { calculatePurchaseBenefits } from "@/lib/transactions/benefits";
import type { PaymentEvent } from "@/lib/transactions/failures";
import { resolveNotificationOutcome } from "@/lib/transactions/notification-routing";
import type { processSuccessfulTransaction } from "@/lib/transactions/processor";
import type { paymentRepository } from "@/lib/transactions/repository";
import { type PaymentProvider, settlementColumns } from "@/lib/transactions/types";

export type NotificationServiceDependencies = {
	fetchStatus: PaymentProvider<unknown>["fetchStatus"];
	find: typeof paymentRepository.findTransactionWithProduct;
	updateStatus: typeof paymentRepository.updateStatus;
	process: (options: Omit<Parameters<typeof processSuccessfulTransaction>[0], "trx">) => Promise<boolean>;
};

export const createNotificationService = (deps: NotificationServiceDependencies) => ({
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
	 * Provider failures are reported as a status so the procedure decides which oRPC error to raise,
	 * and the thrown `PaymentError` carries the provider error code into the log above. A failure
	 * while granting benefits reports `processing_failed` and a failure while recording the status
	 * reports `update_failed`, both logged; only the order lookup rejects.
	 *
	 * @param orderId Order id from the notification payload.
	 * @param purchaseDate Timestamp used as the paid-at time and the basis for premium expiry.
	 * @returns One of `ok`, `not_found`, `already_processed`, `user_deleted`, `verification_failed`,
	 * `processing_failed`, or `update_failed`.
	 */
	async process(orderId: string, purchaseDate: Date) {
		const existingTransaction = await deps.find(orderId);
		if (!existingTransaction) return { status: "not_found" } as const;

		let event: PaymentEvent;
		try {
			event = await deps.fetchStatus(orderId);
		} catch (error) {
			console.error("payment status fetch failed", error);
			return { status: "verification_failed" } as const;
		}

		const outcome = resolveNotificationOutcome(event, existingTransaction, purchaseDate, calculatePurchaseBenefits);

		if (outcome.action === "already_processed" || outcome.action === "user_deleted") {
			return { status: outcome.action } as const;
		}

		if (outcome.action === "amount_mismatch") {
			console.error("payment amount does not match the order", outcome);
			return { status: "amount_mismatch" } as const;
		}

		if (outcome.action === "process_success") {
			const applied = await deps
				.process({
					orderId,
					userId: outcome.userId,
					existingTransaction,
					purchaseDate,
					benefits: outcome.benefits,
					settlement: settlementColumns(event),
				})
				.catch((error) => {
					console.error("payment processing failed", error);
					return null;
				});
			if (applied === null) return { status: "processing_failed" } as const;
			if (!applied) return { status: "already_processed" } as const;
		} else if (outcome.action === "update_status") {
			const failure = outcome.status === "failed" ? outcome.failure : undefined;
			const detail = outcome.status === "failed" ? outcome.detail : undefined;
			const update = { status: outcome.status, failure, detail, ...settlementColumns(event) };
			const updated = await deps.updateStatus(orderId, update).then(
				() => true,
				(error) => {
					console.error("payment status update failed", error);
					return false;
				},
			);
			if (!updated) return { status: "update_failed" } as const;
		}

		return { status: "ok" } as const;
	},
});
