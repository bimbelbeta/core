import { describe, expect, mock, spyOn, test } from "bun:test";
import { PaymentError } from "./errors";
import { createNotificationService } from "./notification.service";
import type { PaymentStatus, TransactionWithProduct } from "./types";

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
		fetchStatus: mock(async (): Promise<PaymentStatus> => "pending"),
		find: mock(async (): Promise<TransactionWithProduct | null> => transaction),
		updateStatus: mock(async (_orderId: string, _status: "pending" | "failed") => {}),
		process: mock(async (): Promise<boolean> => true),
	};
	return { deps, service: createNotificationService(deps) };
}

describe("notification service", () => {
	test("updates pending transactions", async () => {
		const { deps, service } = setup();
		expect(await service.process("order-1", date)).toEqual({ status: "ok" });
		expect(deps.updateStatus).toHaveBeenCalledWith("order-1", "pending");
	});

	test("applies benefits once for a paid transaction", async () => {
		const { deps, service } = setup();
		deps.fetchStatus.mockResolvedValue("paid");
		expect(await service.process("order-1", date)).toEqual({ status: "ok" });
		expect(deps.process).toHaveBeenCalledTimes(1);
	});

	test("reports already_processed when the payment was claimed elsewhere", async () => {
		const { deps, service } = setup();
		deps.fetchStatus.mockResolvedValue("paid");
		deps.process.mockResolvedValue(false);
		expect(await service.process("order-1", date)).toEqual({ status: "already_processed" });
	});

	test("reports a failed benefit write and keeps a trace", async () => {
		const { deps, service } = setup();
		deps.fetchStatus.mockResolvedValue("paid");
		deps.process.mockRejectedValue(new Error("processing failed"));
		const log = spyOn(console, "error").mockImplementation(() => {});
		try {
			expect(await service.process("order-1", date)).toEqual({ status: "processing_failed" });
			expect(log).toHaveBeenCalled();
		} finally {
			log.mockRestore();
		}
	});

	test("returns not_found for unknown transactions", async () => {
		const { deps, service } = setup();
		deps.find.mockResolvedValueOnce(null);
		expect(await service.process("missing", date)).toEqual({ status: "not_found" });
		expect(deps.updateStatus).not.toHaveBeenCalled();
	});

	test("reports a failed status fetch and logs the provider error", async () => {
		const { deps, service } = setup();
		const failure = new PaymentError("PROVIDER_UNAVAILABLE", "down");
		deps.fetchStatus.mockRejectedValue(failure);
		const log = spyOn(console, "error").mockImplementation(() => {});
		try {
			expect(await service.process("order-1", date)).toEqual({ status: "verification_failed" });
			expect(log).toHaveBeenCalledWith("payment status fetch failed", failure);
		} finally {
			log.mockRestore();
		}
	});

	test("reports a failed status update", async () => {
		const { deps, service } = setup();
		deps.updateStatus.mockRejectedValue(new Error("update failed"));
		expect(await service.process("order-1", date)).toEqual({ status: "update_failed" });
	});
});
