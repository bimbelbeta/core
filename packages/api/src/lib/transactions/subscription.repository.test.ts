import { expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { createSubscriptionRepository } from "./subscription.repository";

test("repository accepts the database and a transaction handle", () => {
	const factory: (transaction: Parameters<Parameters<typeof db.transaction>[0]>[0]) => unknown =
		createSubscriptionRepository;
	expect(factory).toBe(createSubscriptionRepository);
	expect(createSubscriptionRepository(db)).toBeDefined();
});
