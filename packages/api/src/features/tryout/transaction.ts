import { db } from "@bimbelbeta/db";
import { createCreditRepository } from "@/features/credit/repository";
import { createTryoutRepository, type TryoutTransaction } from "./repository";

export const runInTransaction = <T>(fn: (transaction: TryoutTransaction) => Promise<T>): Promise<T> =>
	db.transaction((trx) => fn({ repository: createTryoutRepository(trx), credit: createCreditRepository(trx) }));
