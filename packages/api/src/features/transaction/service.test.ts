import { describe, expect, mock, spyOn, test } from "bun:test";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { AlreadyPremiumError } from "./errors";
import type { createNotificationService } from "./notification.service";
import type { MidtransNotification } from "./providers/midtrans";
import type { TransactionRow } from "./repository";
import { createTransactionService } from "./service";
import type { createSubscriptionService } from "./subscription.service";

type SubscriptionResult = Awaited<ReturnType<ReturnType<typeof createSubscriptionService>["subscribe"]>>;
type NotificationResult = Awaited<ReturnType<ReturnType<typeof createNotificationService>["process"]>>;

const now = new Date();
const sessionUser: Session["user"] = {
	id: "user-1",
	name: "User",
	email: "user@example.com",
	emailVerified: false,
	image: null,
	createdAt: now,
	updatedAt: now,
	role: "user",
	isPremium: false,
	premiumExpiresAt: null,
	tryoutCredits: 0,
	targetUniversityId: null,
	targetStudyProgramId: null,
};
const checkout = { provider: "midtrans", token: "token", redirectUrl: "https://pay.example.com" };
const payload: MidtransNotification = {
	order_id: "order-1",
	status_code: "200",
	gross_amount: "10000",
	signature_key: "signature",
};
const purchaseDate = new Date("2025-01-15T10:00:00Z");

function transactionRow(overrides: Partial<TransactionRow> = {}): TransactionRow {
	return {
		id: "order-1",
		userId: "user-1",
		productId: "product-1",
		grossAmount: "10000",
		status: "pending",
		failureCode: null,
		failureDetail: null,
		provider: "midtrans",
		providerTransactionId: null,
		amountPaid: null,
		paymentMethod: null,
		expiresAt: now,
		paidAt: null,
		orderedAt: now,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

function setup() {
	const subscriptionService = {
		subscribe: mock(async (): Promise<SubscriptionResult> => ({ status: "ok", checkout })),
	};
	const notificationService = {
		process: mock(async (): Promise<NotificationResult> => ({ status: "ok" })),
	};
	const verifyNotification = mock((): boolean => true);
	const repository = {
		findForMember: mock(async (): Promise<TransactionRow | undefined> => transactionRow()),
	};
	const service = createTransactionService({
		repository,
		subscriptionService,
		notificationService,
		verifyNotification,
	});
	return { subscriptionService, notificationService, verifyNotification, repository, service };
}

describe("transaction service", () => {
	test("subscribe returns the checkout and passes the caller through", async () => {
		const { subscriptionService, service } = setup();

		const result = await service.subscribe("premium", sessionUser);

		expect(result).toEqual(checkout);
		expect(subscriptionService.subscribe).toHaveBeenCalledWith("premium", sessionUser);
	});

	test("subscribe reports a missing product as not found", async () => {
		const { subscriptionService, service } = setup();
		subscriptionService.subscribe.mockResolvedValueOnce({ status: "not_found" });

		await expect(service.subscribe("missing", sessionUser)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Produk tidak ditemukan.",
		});
	});

	test("subscribe refuses a premium member as unprocessable content", async () => {
		const { subscriptionService, service } = setup();
		subscriptionService.subscribe.mockResolvedValueOnce({ status: "already_premium" });

		const error = await service
			.subscribe("premium", { ...sessionUser, isPremium: true })
			.catch((error: unknown) => error);

		expect(error).toBeInstanceOf(AlreadyPremiumError);
		expect(error).toMatchObject({ message: "Kamu sudah menjadi member premium." });
	});

	test("subscribe reports a gateway failure as a server error", async () => {
		const { subscriptionService, service } = setup();
		subscriptionService.subscribe.mockResolvedValueOnce({ status: "payment_failed" });

		await expect(service.subscribe("premium", sessionUser)).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
			message: "Gagal memproses pembayaran. Silahkan coba lagi.",
		});
	});

	test("status reports a missing order as not found", async () => {
		const { repository, service } = setup();
		repository.findForMember.mockResolvedValueOnce(undefined);

		const error = await service.status("order-1", sessionUser).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(DomainError);
		expect(error).toMatchObject({ code: "NOT_FOUND", message: "Transaksi tidak ditemukan" });
		expect(repository.findForMember).toHaveBeenCalledWith("order-1", sessionUser.id);
	});

	test("status maps the stored row onto the response", async () => {
		const { repository, service } = setup();
		repository.findForMember.mockResolvedValueOnce(
			transactionRow({
				status: "failed",
				failureCode: "card_declined",
				failureDetail: "Ditolak",
				paidAt: purchaseDate,
			}),
		);

		await expect(service.status("order-1", sessionUser)).resolves.toEqual({
			status: "failed",
			failureCode: "card_declined",
			failureDetail: "Ditolak",
			paidAt: purchaseDate.toISOString(),
		});

		repository.findForMember.mockResolvedValueOnce(
			transactionRow({ status: "pending", failureCode: "insufficient_balance", failureDetail: null }),
		);

		await expect(service.status("order-1", sessionUser)).resolves.toEqual({
			status: "pending",
			failureCode: "insufficient_balance",
			failureDetail: null,
			paidAt: null,
		});
	});

	test("processNotification verifies the signature before anything else", async () => {
		const { notificationService, service, verifyNotification } = setup();
		verifyNotification.mockReturnValueOnce(false);

		await expect(service.processNotification(payload, purchaseDate)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
			message: "Invalid webhook signature.",
		});
		expect(verifyNotification).toHaveBeenCalledWith(payload);
		expect(notificationService.process).not.toHaveBeenCalled();

		const failure = new Error("no server key");
		const log = spyOn(console, "error").mockImplementation(() => {});
		verifyNotification.mockImplementationOnce(() => {
			throw failure;
		});
		try {
			await expect(service.processNotification(payload, purchaseDate)).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
				message: "Gagal memverifikasi pembayaran.",
			});
			expect(log).toHaveBeenCalledWith("payment notification verification failed", failure);
		} finally {
			log.mockRestore();
		}
		expect(notificationService.process).not.toHaveBeenCalled();
	});

	test("processNotification passes the order and purchase date through", async () => {
		const { notificationService, service } = setup();

		await expect(service.processNotification(payload, purchaseDate)).resolves.toEqual({ status: "ok" });
		expect(notificationService.process).toHaveBeenCalledWith(payload.order_id, purchaseDate);
	});

	test("processNotification returns the benign outcomes as they are", async () => {
		const { notificationService, service } = setup();

		for (const status of ["not_found", "already_processed", "user_deleted"] as const) {
			notificationService.process.mockResolvedValueOnce({ status });
			await expect(service.processNotification(payload, purchaseDate)).resolves.toEqual({ status });
		}
	});

	test("processNotification reports provider failures as server errors", async () => {
		const { notificationService, service } = setup();

		for (const [status, message] of [
			["verification_failed", "Gagal memverifikasi status transaksi."],
			["processing_failed", "Gagal memproses transaksi."],
			["update_failed", "Gagal memperbarui status transaksi."],
			["amount_mismatch", "Nominal pembayaran tidak sesuai."],
		] as const) {
			notificationService.process.mockResolvedValueOnce({ status });
			await expect(service.processNotification(payload, purchaseDate)).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
				message,
			});
		}
	});
});
