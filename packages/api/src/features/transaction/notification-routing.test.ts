import { describe, expect, test } from "bun:test";
import { resolveNotificationOutcome } from "./notification-routing";
import type { PurchaseBenefits, TransactionWithProduct } from "./types";

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
			productId: "product-1",
			grossAmount: "100000.00",
			status: "pending",
			failureCode: null,
			failureDetail: null,
			provider: "midtrans",
			providerTransactionId: null,
			amountPaid: null,
			paymentMethod: null,
			expiresAt: null,
			paidAt: null,
			orderedAt: PURCHASE_DATE,
			createdAt: PURCHASE_DATE,
			updatedAt: PURCHASE_DATE,
			...overrides,
		},
	};
}

describe("resolveNotificationOutcome", () => {
	test("returns already_processed when the transaction was already paid", () => {
		const tx = makeTx({ paidAt: new Date("2025-01-10") });
		expect(resolveNotificationOutcome({ status: "paid" }, tx, PURCHASE_DATE, calcBenefits)).toEqual({
			action: "already_processed",
		});
	});

	test("returns user_deleted when a paid transaction has no user", () => {
		const tx = makeTx({ userId: null });
		expect(resolveNotificationOutcome({ status: "paid" }, tx, PURCHASE_DATE, calcBenefits)).toEqual({
			action: "user_deleted",
		});
	});

	test("grants benefits for a paid transaction", () => {
		const outcome = resolveNotificationOutcome({ status: "paid" }, makeTx(), PURCHASE_DATE, calcBenefits);
		expect(outcome).toEqual({ action: "process_success", userId: "user-abc", benefits: mockBenefits });
	});

	test("carries the failure reason into the status write", () => {
		expect(
			resolveNotificationOutcome(
				{ status: "failed", failure: "insufficient_balance" },
				makeTx(),
				PURCHASE_DATE,
				calcBenefits,
			),
		).toEqual({
			action: "update_status",
			status: "failed",
			failure: "insufficient_balance",
		});
	});

	test("updates the status for failed and pending payments", () => {
		expect(resolveNotificationOutcome({ status: "failed" }, makeTx(), PURCHASE_DATE, calcBenefits)).toEqual({
			action: "update_status",
			status: "failed",
		});
		expect(resolveNotificationOutcome({ status: "pending" }, makeTx(), PURCHASE_DATE, calcBenefits)).toEqual({
			action: "update_status",
			status: "pending",
		});
	});

	test("does nothing for an unresolved status", () => {
		expect(resolveNotificationOutcome({ status: "unknown" }, makeTx(), PURCHASE_DATE, calcBenefits)).toEqual({
			action: "noop",
		});
	});
});

describe("amount check", () => {
	test("refuses to grant when the settled amount is not what was charged", () => {
		expect(
			resolveNotificationOutcome({ status: "paid", amountPaid: "1000.00" }, makeTx(), PURCHASE_DATE, calcBenefits),
		).toEqual({ action: "amount_mismatch", expected: "100000.00", received: "1000.00" });
	});

	test("grants when the amounts match regardless of decimal formatting", () => {
		expect(
			resolveNotificationOutcome({ status: "paid", amountPaid: "100000" }, makeTx(), PURCHASE_DATE, calcBenefits)
				.action,
		).toBe("process_success");
	});

	test("grants when the provider did not report an amount", () => {
		expect(resolveNotificationOutcome({ status: "paid" }, makeTx(), PURCHASE_DATE, calcBenefits).action).toBe(
			"process_success",
		);
	});
});
