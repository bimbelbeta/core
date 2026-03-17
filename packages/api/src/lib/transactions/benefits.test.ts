import { describe, expect, test } from "bun:test";
import { calculateFixedDateExpiry, calculateMonthlyExpiry, calculatePurchaseBenefits } from "./benefits";

// ─── calculateFixedDateExpiry ──────────────────────────────────────────────────
describe("calculateFixedDateExpiry", () => {
	test("returns this year's expiry when purchase date is before it", () => {
		// Purchase on Jan 1, expiry set for Dec 31 of same year
		const purchaseDate = new Date(2025, 0, 1); // 2025-01-01
		const result = calculateFixedDateExpiry(purchaseDate, 12, 31);
		expect(result).toEqual(new Date(2025, 11, 31));
	});

	test("returns next year's expiry when purchase date is after the fixed date", () => {
		// Purchase on Dec 31, expiry was June 30 — already passed, so next year
		const purchaseDate = new Date(2025, 11, 31); // 2025-12-31
		const result = calculateFixedDateExpiry(purchaseDate, 6, 30);
		expect(result).toEqual(new Date(2026, 5, 30));
	});

	test("returns this year's expiry when purchase date equals the fixed date", () => {
		// Purchase exactly on the expiry date — not strictly after, so this year
		const purchaseDate = new Date(2025, 5, 30); // 2025-06-30
		const result = calculateFixedDateExpiry(purchaseDate, 6, 30);
		expect(result).toEqual(new Date(2025, 5, 30));
	});

	test("returns next year when purchase date is one day after fixed date", () => {
		const purchaseDate = new Date(2025, 5, 30); // 2025-06-30
		// Fixed date is June 29, purchase is June 30 → next year
		const result = calculateFixedDateExpiry(purchaseDate, 6, 29);
		expect(result).toEqual(new Date(2026, 5, 29));
	});
});

// ─── calculateMonthlyExpiry ────────────────────────────────────────────────────
describe("calculateMonthlyExpiry", () => {
	test("adds duration days to purchase date", () => {
		const purchaseDate = new Date(2025, 0, 1); // 2025-01-01
		const result = calculateMonthlyExpiry(purchaseDate, 30);
		expect(result).toEqual(new Date(2025, 0, 31)); // 2025-01-31
	});

	test("handles month overflow correctly", () => {
		const purchaseDate = new Date(2025, 0, 20); // 2025-01-20
		const result = calculateMonthlyExpiry(purchaseDate, 30);
		// 2025-01-20 + 30 days = 2025-02-19
		expect(result).toEqual(new Date(2025, 1, 19));
	});

	test("handles 365-day annual plan", () => {
		const purchaseDate = new Date(2025, 0, 1); // 2025-01-01
		const result = calculateMonthlyExpiry(purchaseDate, 365);
		expect(result).toEqual(new Date(2026, 0, 1)); // 2026-01-01
	});

	test("does not mutate the input date", () => {
		const purchaseDate = new Date(2025, 0, 1);
		const original = purchaseDate.getTime();
		calculateMonthlyExpiry(purchaseDate, 30);
		expect(purchaseDate.getTime()).toBe(original);
	});
});

// ─── calculatePurchaseBenefits ─────────────────────────────────────────────────
describe("calculatePurchaseBenefits", () => {
	const purchaseDate = new Date(2025, 0, 1); // 2025-01-01

	// fixed_date variant
	describe("fixed_date variant", () => {
		const fixedDateTx = {
			prodVariant: "fixed_date" as const,
			prodFixedExpiryMonth: 12,
			prodFixedExpiryDay: 31,
			prodDurationDays: null,
			prodCredits: null,
		};

		test("grantsPremium is true", () => {
			expect(
				calculatePurchaseBenefits(fixedDateTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.grantsPremium,
			).toBe(true);
		});

		test("grantsCredits is false when no credits", () => {
			expect(
				calculatePurchaseBenefits(fixedDateTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.grantsCredits,
			).toBe(false);
		});

		test("creditsToAdd is null when no credits", () => {
			expect(
				calculatePurchaseBenefits(fixedDateTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.creditsToAdd,
			).toBeNull();
		});

		test("premiumExpiry is set to fixed date", () => {
			const result = calculatePurchaseBenefits(
				fixedDateTx as Parameters<typeof calculatePurchaseBenefits>[0],
				purchaseDate,
			);
			expect(result.premiumExpiry).toEqual(new Date(2025, 11, 31));
		});

		test("with credits: grantsCredits is true and creditsToAdd is set", () => {
			const txWithCredits = { ...fixedDateTx, prodCredits: 5 };
			const result = calculatePurchaseBenefits(
				txWithCredits as Parameters<typeof calculatePurchaseBenefits>[0],
				purchaseDate,
			);
			expect(result.grantsCredits).toBe(true);
			expect(result.creditsToAdd).toBe(5);
		});
	});

	// monthly variant
	describe("monthly variant", () => {
		const monthlyTx = {
			prodVariant: "monthly" as const,
			prodFixedExpiryMonth: null,
			prodFixedExpiryDay: null,
			prodDurationDays: 30,
			prodCredits: null,
		};

		test("grantsPremium is true", () => {
			expect(
				calculatePurchaseBenefits(monthlyTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.grantsPremium,
			).toBe(true);
		});

		test("premiumExpiry is purchase date plus duration days", () => {
			const result = calculatePurchaseBenefits(
				monthlyTx as Parameters<typeof calculatePurchaseBenefits>[0],
				purchaseDate,
			);
			expect(result.premiumExpiry).toEqual(new Date(2025, 0, 31));
		});

		test("grantsCredits is false when prodCredits is null", () => {
			expect(
				calculatePurchaseBenefits(monthlyTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.grantsCredits,
			).toBe(false);
		});

		test("with credits: creditsToAdd is set correctly", () => {
			const txWithCredits = { ...monthlyTx, prodCredits: 10 };
			const result = calculatePurchaseBenefits(
				txWithCredits as Parameters<typeof calculatePurchaseBenefits>[0],
				purchaseDate,
			);
			expect(result.grantsCredits).toBe(true);
			expect(result.creditsToAdd).toBe(10);
		});
	});

	// credits-only variant
	describe("credits-only variant", () => {
		const creditsTx = {
			prodVariant: "credits" as const,
			prodFixedExpiryMonth: null,
			prodFixedExpiryDay: null,
			prodDurationDays: null,
			prodCredits: 20,
		};

		test("grantsPremium is false", () => {
			expect(
				calculatePurchaseBenefits(creditsTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.grantsPremium,
			).toBe(false);
		});

		test("premiumExpiry is null", () => {
			expect(
				calculatePurchaseBenefits(creditsTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.premiumExpiry,
			).toBeNull();
		});

		test("grantsCredits is true", () => {
			expect(
				calculatePurchaseBenefits(creditsTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.grantsCredits,
			).toBe(true);
		});

		test("creditsToAdd reflects product credits", () => {
			expect(
				calculatePurchaseBenefits(creditsTx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate)
					.creditsToAdd,
			).toBe(20);
		});
	});

	// edge cases
	describe("edge cases", () => {
		test("prodCredits of 0 does not grant credits", () => {
			const tx = {
				prodVariant: "monthly" as const,
				prodFixedExpiryMonth: null,
				prodFixedExpiryDay: null,
				prodDurationDays: 30,
				prodCredits: 0,
			};
			const result = calculatePurchaseBenefits(tx as Parameters<typeof calculatePurchaseBenefits>[0], purchaseDate);
			expect(result.grantsCredits).toBe(false);
			expect(result.creditsToAdd).toBeNull();
		});
	});
});
