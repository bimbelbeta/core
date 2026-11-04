import { expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { createPaymentRepository } from "./repository";

test("accepts the shared connection or an open transaction", () => {
	const fromTransaction: (trx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => unknown =
		createPaymentRepository;
	expect(fromTransaction).toBe(createPaymentRepository);
	expect(createPaymentRepository(db)).toBeDefined();
});
