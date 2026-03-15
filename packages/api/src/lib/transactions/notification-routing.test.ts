import { describe, expect, test } from "bun:test";
import { resolveNotificationOutcome } from "./notification-routing";
import type { PurchaseBenefits, TransactionWithProduct } from "./types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PURCHASE_DATE = new Date("2025-01-15T10:00:00Z");

const mockBenefits: PurchaseBenefits = {
	grantsPremium: true,
	grantsCredits: false,
	premiumExpiry: new Date("2025-12-31"),
	creditsToAdd: null,
};

const calcBenefits = (_tx: TransactionWithProduct, _date: Date): PurchaseBenefits => mockBenefits;

function makeTx(overrides?: Partial<TransactionWithProduct["tx"]>): TransactionWithProduct {
	return {
		prodSlug: "premium-30d",
		prodVariant: "monthly",
		prodFixedExpiryMonth: null,
		prodFixedExpiryDay: null,
		prodDurationDays: 30,
		prodCredits: null,
		tx: {
			id: "ORDER-001",
			userId: "user-abc",
			productId: 1,
			grossAmount: "100000.00",
			status: "pending",
			paidAt: null,
			createdAt: PURCHASE_DATE,
			updatedAt: PURCHASE_DATE,
			...overrides,
		} as TransactionWithProduct["tx"],
	};
}

// ─── resolveNotificationOutcome ───────────────────────────────────────────────
describe("resolveNotificationOutcome", () => {
	test("returns not_found when existingTransaction is null", () => {
		const outcome = resolveNotificationOutcome("settlement", "accept", null, PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "not_found" });
	});

	test("returns already_processed when tx.paidAt is set", () => {
		const tx = makeTx({ paidAt: new Date("2025-01-10") });
		const outcome = resolveNotificationOutcome("settlement", "accept", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "already_processed" });
	});

	test("returns user_deleted when settlement but userId is null", () => {
		const tx = makeTx({ userId: null as unknown as string });
		const outcome = resolveNotificationOutcome("settlement", "accept", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "user_deleted" });
	});

	test("returns process_success for settlement status", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome("settlement", "accept", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome.action).toBe("process_success");
		if (outcome.action === "process_success") {
			expect(outcome.userId).toBe("user-abc");
			expect(outcome.benefits).toBe(mockBenefits);
		}
	});

	test("returns process_success for capture + accept fraud status", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome("capture", "accept", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome.action).toBe("process_success");
	});

	test("returns noop for capture + non-accept fraud status", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome("capture", "challenge", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome.action).toBe("noop");
	});

	test("returns update_status failed for cancel", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome("cancel", "accept", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "update_status", status: "failed" });
	});

	test("returns update_status failed for deny", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome("deny", "deny", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "update_status", status: "failed" });
	});

	test("returns update_status failed for expire", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome("expire", "accept", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "update_status", status: "failed" });
	});

	test("returns update_status pending for pending status", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome("pending", "accept", tx, PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "update_status", status: "pending" });
	});

	test("returns noop for unrecognized/unhandled status", () => {
		const tx = makeTx();
		const outcome = resolveNotificationOutcome(
			"refund" as Parameters<typeof resolveNotificationOutcome>[0],
			"accept",
			tx,
			PURCHASE_DATE,
			calcBenefits,
		);
		expect(outcome).toEqual({ action: "noop" });
	});
});
