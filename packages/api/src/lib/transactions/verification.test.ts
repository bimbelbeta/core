import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import type { ProcessSuccessfulTransactionOpts } from "./processor";
import { processSuccessfulTransaction } from "./processor";
import { verifyMidtransSignatureWithKey } from "./verification";

function makeSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
	return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

describe("verifyMidtransSignature", () => {
	const SERVER_KEY = "test-server-key-abc123";
	const ORDER_ID = "ORDER-001";
	const STATUS_CODE = "200";
	const GROSS_AMOUNT = "100000.00";

	test("returns true for a valid signature", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		expect(verifyMidtransSignatureWithKey(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, sig, SERVER_KEY)).toBe(true);
	});

	test("returns false when signature is tampered", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		const tampered = sig.slice(0, -1) + (sig.endsWith("a") ? "b" : "a");
		expect(verifyMidtransSignatureWithKey(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, tampered, SERVER_KEY)).toBe(false);
	});

	test("returns false when orderId does not match", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		expect(verifyMidtransSignatureWithKey("WRONG-ORDER", STATUS_CODE, GROSS_AMOUNT, sig, SERVER_KEY)).toBe(false);
	});

	test("returns false when statusCode does not match", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		expect(verifyMidtransSignatureWithKey(ORDER_ID, "400", GROSS_AMOUNT, sig, SERVER_KEY)).toBe(false);
	});

	test("returns false when grossAmount does not match", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		expect(verifyMidtransSignatureWithKey(ORDER_ID, STATUS_CODE, "999999.00", sig, SERVER_KEY)).toBe(false);
	});

	test("returns false when serverKey does not match", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		expect(verifyMidtransSignatureWithKey(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, sig, "wrong-key")).toBe(false);
	});

	test("is deterministic — same inputs produce same result", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, SERVER_KEY);
		expect(verifyMidtransSignatureWithKey(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, sig, SERVER_KEY)).toBe(true);
		expect(verifyMidtransSignatureWithKey(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, sig, SERVER_KEY)).toBe(true);
	});

	test("empty serverKey still validates consistently", () => {
		const sig = makeSignature(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, "");
		expect(verifyMidtransSignatureWithKey(ORDER_ID, STATUS_CODE, GROSS_AMOUNT, sig, "")).toBe(true);
	});
});

// ─── processSuccessfulTransaction orchestration (mock DB trx) ─────────────────
// We test the orchestration logic of processSuccessfulTransaction by providing a
// hand-rolled mock Drizzle transaction adapter cast to the expected type.

type UpdateReturning = { tryoutCredits: number };

const DRIZZLE_NAME = Symbol.for("drizzle:Name");

type DrizzleTable = { [DRIZZLE_NAME]: string };

type MockTrx = {
	updates: Array<{ table: string; set: Record<string, unknown>; where: string }>;
	inserts: Array<{ table: string; values: Record<string, unknown> }>;
	update: (table: DrizzleTable) => {
		set: (data: Record<string, unknown>) => {
			where: (cond: unknown) => Promise<void> & { returning: (cols: unknown) => Promise<UpdateReturning[]> };
		};
	};
	insert: (table: DrizzleTable) => {
		values: (data: Record<string, unknown>) => Promise<void>;
	};
};

function makeMockTrx(overrides?: Partial<{ tryoutCredits: number }>): MockTrx {
	const mock: MockTrx = {
		updates: [],
		inserts: [],
		update(table) {
			return {
				set(data) {
					return {
						where(cond) {
							mock.updates.push({ table: table[DRIZZLE_NAME], set: data, where: String(cond) });
							const result = Promise.resolve() as Promise<void> & {
								returning: (cols: unknown) => Promise<UpdateReturning[]>;
							};
							result.returning = () => Promise.resolve([{ tryoutCredits: overrides?.tryoutCredits ?? 100 }]);
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

// Minimal transaction fixture matching TransactionWithProduct
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

describe("processSuccessfulTransaction orchestration", () => {
	const ORDER_ID = "ORDER-XYZ";
	const USER_ID = "user-123";
	const PURCHASE_DATE = new Date("2025-01-15T10:00:00Z");

	function run(
		trx: MockTrx,
		benefits: ProcessSuccessfulTransactionOpts["benefits"],
		txOverride?: Partial<typeof baseTransaction>,
	) {
		const trxArg = trx as unknown as ProcessSuccessfulTransactionOpts["trx"];
		return processSuccessfulTransaction({
			trx: trxArg,
			orderId: ORDER_ID,
			userId: USER_ID,
			existingTransaction: { ...baseTransaction, ...txOverride },
			purchaseDate: PURCHASE_DATE,
			benefits,
		});
	}

	test("always marks transaction as success", async () => {
		const trx = makeMockTrx();
		await run(trx, { grantsPremium: false, grantsCredits: false, premiumExpiry: null, creditsToAdd: null });
		const txUpdate = trx.updates.find((u) => u.table === "transaction");
		expect(txUpdate).toBeDefined();
		expect(txUpdate?.set.status).toBe("success");
		expect(txUpdate?.set.paidAt).toBe(PURCHASE_DATE);
	});

	test("grants premium when grantsPremium=true and premiumExpiry set", async () => {
		const expiry = new Date("2025-12-31");
		const trx = makeMockTrx();
		await run(trx, { grantsPremium: true, grantsCredits: false, premiumExpiry: expiry, creditsToAdd: null });
		const userUpdate = trx.updates.find((u) => u.table === "user");
		expect(userUpdate).toBeDefined();
		expect(userUpdate?.set.isPremium).toBe(true);
		expect(userUpdate?.set.premiumExpiresAt).toBe(expiry);
	});

	test("does not update user when grantsPremium=false", async () => {
		const trx = makeMockTrx();
		await run(trx, { grantsPremium: false, grantsCredits: false, premiumExpiry: null, creditsToAdd: null });
		const userUpdate = trx.updates.find((u) => u.table === "user");
		expect(userUpdate).toBeUndefined();
	});

	test("does not update user when premiumExpiry is null even if grantsPremium=true", async () => {
		const trx = makeMockTrx();
		await run(trx, { grantsPremium: true, grantsCredits: false, premiumExpiry: null, creditsToAdd: null });
		const userUpdate = trx.updates.find((u) => u.table === "user");
		expect(userUpdate).toBeUndefined();
	});

	test("inserts credit transaction when grantsCredits=true", async () => {
		const trx = makeMockTrx({ tryoutCredits: 15 });
		await run(trx, { grantsPremium: false, grantsCredits: true, premiumExpiry: null, creditsToAdd: 10 });
		const creditInsert = trx.inserts.find((i) => i.table === "credit_transaction");
		expect(creditInsert).toBeDefined();
		expect(creditInsert?.values.amount).toBe(10);
		expect(creditInsert?.values.userId).toBe(USER_ID);
		expect(creditInsert?.values.transactionId).toBe(ORDER_ID);
		expect(creditInsert?.values.note).toBe(`Purchased ${PROD_SLUG}`);
	});

	test("credit insert uses balanceAfter from DB returning", async () => {
		const trx = makeMockTrx({ tryoutCredits: 25 });
		await run(trx, { grantsPremium: false, grantsCredits: true, premiumExpiry: null, creditsToAdd: 10 });
		const creditInsert = trx.inserts.find((i) => i.table === "credit_transaction");
		expect(creditInsert?.values.balanceAfter).toBe(25);
	});

	test("does not insert credit transaction when grantsCredits=false", async () => {
		const trx = makeMockTrx();
		await run(trx, { grantsPremium: false, grantsCredits: false, premiumExpiry: null, creditsToAdd: null });
		expect(trx.inserts).toHaveLength(0);
	});

	test("happy path: premium + credits both applied", async () => {
		const expiry = new Date("2025-12-31");
		const trx = makeMockTrx({ tryoutCredits: 20 });
		await run(trx, { grantsPremium: true, grantsCredits: true, premiumExpiry: expiry, creditsToAdd: 5 });
		// transaction marked success
		expect(trx.updates.find((u) => u.table === "transaction")?.set.status).toBe("success");
		// user premium set
		expect(trx.updates.find((u) => u.table === "user")?.set.isPremium).toBe(true);
		// credits inserted
		expect(trx.inserts.find((i) => i.table === "credit_transaction")?.values.amount).toBe(5);
	});
});
