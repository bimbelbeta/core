import { describe, expect, test } from "bun:test";
import type { ProcessSuccessfulTransactionOpts } from "./processor";
import { processSuccessfulTransaction } from "./processor";
import type { Settlement } from "./types";

const PROD_SLUG = "premium-30d";
const ORDER_ID = "ORDER-XYZ";
const USER_ID = "user-123";
const PURCHASE_DATE = new Date("2025-01-15T10:00:00Z");
const SETTLEMENT: Settlement = { providerTransactionId: null, amountPaid: null, paymentMethod: null };

const existingTransaction: ProcessSuccessfulTransactionOpts["existingTransaction"] = {
	prodSlug: PROD_SLUG,
	prodVariant: "monthly" as const,
	prodFixedExpiryMonth: null,
	prodFixedExpiryDay: null,
	prodDurationDays: 30,
	prodCredits: null,
	tx: {} as ProcessSuccessfulTransactionOpts["existingTransaction"]["tx"],
};

const noBenefits = { grantsPremium: false, grantsCredits: false, premiumExpiry: null, creditsToAdd: null };

function makeFakes({ claimed = true } = {}) {
	const claims: Array<{ orderId: string; purchaseDate: Date; settlement: Settlement }> = [];
	const premiumGrants: Array<{ userId: string; expiresAt: Date }> = [];
	const creditGrants: Array<{ userId: string; transactionId: string; amount: number; note: string }> = [];

	return {
		claims,
		premiumGrants,
		creditGrants,
		repository: {
			async claimOrder(orderId: string, options: { purchaseDate: Date; settlement: Settlement }) {
				claims.push({ orderId, ...options });
				return claimed;
			},
		},
		userRepository: {
			async grantPremium(userId: string, expiresAt: Date) {
				premiumGrants.push({ userId, expiresAt });
			},
		},
		creditRepository: {
			async grantPurchasedCredits(options: { userId: string; transactionId: string; amount: number; note: string }) {
				creditGrants.push(options);
				return { balanceAfter: 0 };
			},
		},
	};
}

function run(fakes: ReturnType<typeof makeFakes>, benefits: ProcessSuccessfulTransactionOpts["benefits"]) {
	return processSuccessfulTransaction({
		repository: fakes.repository,
		userRepository: fakes.userRepository,
		creditRepository: fakes.creditRepository,
		orderId: ORDER_ID,
		userId: USER_ID,
		existingTransaction,
		purchaseDate: PURCHASE_DATE,
		benefits,
		settlement: SETTLEMENT,
	});
}

describe("processSuccessfulTransaction", () => {
	test("claims the order with the settlement and reports it applied", async () => {
		const fakes = makeFakes();
		expect(await run(fakes, noBenefits)).toBe(true);
		expect(fakes.claims).toEqual([{ orderId: ORDER_ID, purchaseDate: PURCHASE_DATE, settlement: SETTLEMENT }]);
	});

	test("grants premium when benefits include an expiry", async () => {
		const expiry = new Date("2025-12-31");
		const fakes = makeFakes();
		await run(fakes, { grantsPremium: true, grantsCredits: false, premiumExpiry: expiry, creditsToAdd: null });
		expect(fakes.premiumGrants).toEqual([{ userId: USER_ID, expiresAt: expiry }]);
	});

	test("does not grant premium when it is not included", async () => {
		const fakes = makeFakes();
		await run(fakes, noBenefits);
		expect(fakes.premiumGrants).toEqual([]);
	});

	test("does not grant premium when it is included without an expiry", async () => {
		const fakes = makeFakes();
		await run(fakes, { grantsPremium: true, grantsCredits: false, premiumExpiry: null, creditsToAdd: null });
		expect(fakes.premiumGrants).toEqual([]);
	});

	test("grants credits against the order and the purchased product", async () => {
		const fakes = makeFakes();
		await run(fakes, { grantsPremium: false, grantsCredits: true, premiumExpiry: null, creditsToAdd: 10 });
		expect(fakes.creditGrants).toEqual([
			{ userId: USER_ID, transactionId: ORDER_ID, amount: 10, note: `Purchased ${PROD_SLUG}` },
		]);
	});

	test("does not grant credits when none are included", async () => {
		const fakes = makeFakes();
		await run(fakes, noBenefits);
		expect(fakes.creditGrants).toEqual([]);
	});

	test("grants both premium and credits", async () => {
		const expiry = new Date("2025-12-31");
		const fakes = makeFakes();
		await run(fakes, { grantsPremium: true, grantsCredits: true, premiumExpiry: expiry, creditsToAdd: 5 });
		expect(fakes.premiumGrants).toHaveLength(1);
		expect(fakes.creditGrants).toHaveLength(1);
	});

	test("grants nothing when another caller already claimed the order", async () => {
		const fakes = makeFakes({ claimed: false });
		const applied = await run(fakes, {
			grantsPremium: true,
			grantsCredits: true,
			premiumExpiry: PURCHASE_DATE,
			creditsToAdd: 5,
		});
		expect(applied).toBe(false);
		expect(fakes.premiumGrants).toEqual([]);
		expect(fakes.creditGrants).toEqual([]);
	});
});
