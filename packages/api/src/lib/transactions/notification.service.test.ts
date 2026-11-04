import { describe, expect, mock, test } from "bun:test";
import { createNotificationService } from "./notification.service";
import type { MidtransStatus, TransactionWithProduct } from "./types";

const date = new Date("2025-01-15T10:00:00Z");
const transaction: TransactionWithProduct = {
	prodSlug: "credits",
	prodVariant: "credits",
	prodFixedExpiryMonth: null,
	prodFixedExpiryDay: null,
	prodDurationDays: null,
	prodCredits: 5,
	tx: {
		id: "order-1",
		userId: "user-1",
		productId: "product-1",
		grossAmount: "10000",
		status: "pending",
		paidAt: null,
		orderedAt: date,
		createdAt: date,
		updatedAt: date,
	},
};

function setup() {
	const deps = {
		verify: mock(async (): Promise<MidtransStatus> => ({ transaction_status: "pending", fraud_status: "accept" })),
		find: mock(async (): Promise<TransactionWithProduct | null> => transaction),
		updateStatus: mock(async (_orderId: string, _status: "pending" | "failed") => {}),
		process: mock(async () => {}),
	};
	return { deps, service: createNotificationService(deps) };
}

describe("notification service", () => {
	test("updates pending transactions", async () => {
		const { deps, service } = setup();
		expect(await service.process("order-1", date)).toEqual({ status: "ok" });
		expect(deps.updateStatus).toHaveBeenCalledWith("order-1", "pending");
	});

	test("processes successful payments and reports processing failures", async () => {
		const { deps, service } = setup();
		deps.verify.mockResolvedValue({ transaction_status: "settlement", fraud_status: "accept" });
		expect(await service.process("order-1", date)).toEqual({ status: "ok" });
		expect(deps.process).toHaveBeenCalledTimes(1);
		deps.process.mockRejectedValueOnce(new Error("processing failed"));
		expect(await service.process("order-1", date)).toEqual({ status: "processing_failed" });
	});

	test("returns not_found for unknown transactions", async () => {
		const { deps, service } = setup();
		deps.find.mockResolvedValueOnce(null);
		expect(await service.process("missing", date)).toEqual({ status: "not_found" });
		expect(deps.updateStatus).not.toHaveBeenCalled();
	});

	test("reports verification and update failures", async () => {
		const { deps, service } = setup();
		deps.verify.mockRejectedValueOnce(new Error("verification failed"));
		expect(await service.process("order-1", date)).toEqual({ status: "verification_failed" });
		deps.updateStatus.mockRejectedValueOnce(new Error("update failed"));
		expect(await service.process("order-1", date)).toEqual({ status: "update_failed" });
	});
});
