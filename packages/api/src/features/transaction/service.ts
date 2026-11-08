import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import type { createNotificationService } from "./notification.service";
import type { MidtransNotification } from "./providers/midtrans";
import type { TransactionRepository } from "./repository";
import type { createSubscriptionService } from "./subscription.service";
import type { Checkout } from "./types";

export type TransactionServiceDependencies = {
	repository: Pick<TransactionRepository, "findForMember">;
	subscriptionService: ReturnType<typeof createSubscriptionService>;
	notificationService: ReturnType<typeof createNotificationService>;
	verifyNotification: (payload: MidtransNotification) => boolean;
};

export function createTransactionService(deps: TransactionServiceDependencies) {
	return {
		async subscribe(slug: string, user: Session["user"]): Promise<Checkout> {
			const result = await deps.subscriptionService.subscribe(slug, user);

			if (result.status === "ok") return result.checkout;
			if (result.status === "not_found") throw new DomainError("NOT_FOUND", "Produk tidak ditemukan.");
			if (result.status === "already_premium")
				throw new DomainError("UNPROCESSABLE_CONTENT", "Kamu sudah menjadi member premium.");
			throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memproses pembayaran. Silahkan coba lagi.");
		},

		async processNotification(payload: MidtransNotification, purchaseDate: Date) {
			let verified: boolean;
			try {
				verified = deps.verifyNotification(payload);
			} catch (error) {
				console.error("payment notification verification failed", error);
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memverifikasi pembayaran.");
			}

			if (!verified) throw new DomainError("UNAUTHORIZED", "Invalid webhook signature.");

			const result = await deps.notificationService.process(payload.order_id, purchaseDate);

			if (result.status === "verification_failed")
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memverifikasi status transaksi.");
			if (result.status === "processing_failed")
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memproses transaksi.");
			if (result.status === "update_failed")
				throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal memperbarui status transaksi.");
			if (result.status === "amount_mismatch")
				throw new DomainError("INTERNAL_SERVER_ERROR", "Nominal pembayaran tidak sesuai.");

			return result;
		},

		async status(orderId: string, user: Session["user"]) {
			const row = await deps.repository.findForMember(orderId, user.id);

			if (!row) {
				throw new DomainError("NOT_FOUND", "Transaksi tidak ditemukan");
			}

			return {
				status: row.status,
				failureCode: row.failureCode,
				failureDetail: row.failureDetail,
				paidAt: row.paidAt?.toISOString() ?? null,
			};
		},
	};
}
