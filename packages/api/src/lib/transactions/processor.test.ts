import { describe, expect, test } from "bun:test";
import { PgDialect } from "drizzle-orm/pg-core";
import type { ProcessSuccessfulTransactionOpts } from "./processor";
import { processSuccessfulTransaction } from "./processor";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");

type DrizzleTable = { [DRIZZLE_NAME]: string };

type UpdateResult = Promise<void> & { returning: (columns?: unknown) => Promise<unknown[]> };

type MockTrx = {
	updates: Array<{ table: string; set: Record<string, unknown>; where: string }>;
	inserts: Array<{ table: string; values: Record<string, unknown> }>;
	update: (table: DrizzleTable) => {
		set: (data: Record<string, unknown>) => { where: (cond: unknown) => UpdateResult };
	};
	insert: (table: DrizzleTable) => { values: (data: Record<string, unknown>) => Promise<void> };
};

function makeMockTrx({ claimed = true, tryoutCredits = 100 } = {}): MockTrx {
	const mock: MockTrx = {
		updates: [],
		inserts: [],
		update(table) {
			return {
				set(data) {
					return {
						where(condition: unknown) {
							mock.updates.push({
								table: table[DRIZZLE_NAME],
								set: data,
								where: new PgDialect().sqlToQuery(condition as never).sql,
							});
							const result = Promise.resolve() as UpdateResult;
							result.returning = () =>
								Promise.resolve(
									table[DRIZZLE_NAME] === "transaction" ? (claimed ? [{ id: "ORDER-XYZ" }] : []) : [{ tryoutCredits }],
								);
							return result;
						},
					};
				},
			};
		},
		insert(table) {
			return {
				values(data) {
					mock.inserts.push({ table: table[DRIZZLE_NAME], values: data });
					return Promise.resolve();
				},
			};
		},
	};
	return mock;
}

const PROD_SLUG = "premium-30d";
const baseTransaction: ProcessSuccessfulTransactionOpts["existingTransaction"] = {
	prodSlug: PROD_SLUG,
	prodVariant: "monthly" as const,
	prodFixedExpiryMonth: null,
	prodFixedExpiryDay: null,
	prodDurationDays: 30,
	prodCredits: null,
	tx: {} as ProcessSuccessfulTransactionOpts["existingTransaction"]["tx"],
};

const ORDER_ID = "ORDER-XYZ";
const USER_ID = "user-123";
const PURCHASE_DATE = new Date("2025-01-15T10:00:00Z");

function run(trx: MockTrx, benefits: ProcessSuccessfulTransactionOpts["benefits"]) {
	return processSuccessfulTransaction({
		trx: trx as unknown as ProcessSuccessfulTransactionOpts["trx"],
		orderId: ORDER_ID,
		userId: USER_ID,
		existingTransaction: baseTransaction,
		purchaseDate: PURCHASE_DATE,
		benefits,
	});
}

const noBenefits = { grantsPremium: false, grantsCredits: false, premiumExpiry: null, creditsToAdd: null };

describe("processSuccessfulTransaction", () => {
	test("always marks the transaction as success and reports it applied", async () => {
		const trx = makeMockTrx();
		expect(await run(trx, noBenefits)).toBe(true);
		const txUpdate = trx.updates.find((update) => update.table === "transaction");
		expect(txUpdate?.set).toEqual({ status: "success", paidAt: PURCHASE_DATE });
	});

	test("claims the order only while it is still unpaid", async () => {
		const trx = makeMockTrx();
		await run(trx, noBenefits);
		const claim = trx.updates.find((update) => update.table === "transaction");
		expect(claim?.where).toMatch(/paid_at.*is null/i);
	});

	test("grants premium when benefits include an expiry", async () => {
		const expiry = new Date("2025-12-31");
		const trx = makeMockTrx();
		await run(trx, { grantsPremium: true, grantsCredits: false, premiumExpiry: expiry, creditsToAdd: null });
		expect(trx.updates.find((update) => update.table === "user")?.set).toEqual({
			isPremium: true,
			premiumExpiresAt: expiry,
		});
	});

	test("does not touch the user when premium is not granted", async () => {
		const trx = makeMockTrx();
		await run(trx, noBenefits);
		expect(trx.updates.find((update) => update.table === "user")).toBeUndefined();
	});

	test("does not touch the user when premium is granted without an expiry", async () => {
		const trx = makeMockTrx();
		await run(trx, { grantsPremium: true, grantsCredits: false, premiumExpiry: null, creditsToAdd: null });
		expect(trx.updates.find((update) => update.table === "user")).toBeUndefined();
	});

	test("records a credit transaction with the balance returned by the database", async () => {
		const trx = makeMockTrx({ tryoutCredits: 25 });
		await run(trx, { grantsPremium: false, grantsCredits: true, premiumExpiry: null, creditsToAdd: 10 });
		expect(trx.inserts).toEqual([
			{
				table: "credit_transaction",
				values: {
					userId: USER_ID,
					transactionId: ORDER_ID,
					amount: 10,
					balanceAfter: 25,
					note: `Purchased ${PROD_SLUG}`,
				},
			},
		]);
	});

	test("does not insert credits when none are granted", async () => {
		const trx = makeMockTrx();
		await run(trx, noBenefits);
		expect(trx.inserts).toHaveLength(0);
	});

	test("grants both premium and credits", async () => {
		const expiry = new Date("2025-12-31");
		const trx = makeMockTrx({ tryoutCredits: 20 });
		await run(trx, { grantsPremium: true, grantsCredits: true, premiumExpiry: expiry, creditsToAdd: 5 });
		expect(trx.updates.find((update) => update.table === "user")?.set.isPremium).toBe(true);
		expect(trx.inserts[0]?.values.amount).toBe(5);
	});

	test("applies nothing when the payment was already claimed", async () => {
		const trx = makeMockTrx({ claimed: false });
		expect(
			await run(trx, { grantsPremium: true, grantsCredits: true, premiumExpiry: PURCHASE_DATE, creditsToAdd: 5 }),
		).toBe(false);
		expect(trx.updates.filter((update) => update.table === "user")).toHaveLength(0);
		expect(trx.inserts).toHaveLength(0);
	});
});
