import { db } from "@bimbelbeta/db";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import { buildStringIdCursorPage, decodePageInput, parseStringIdCursor } from "@/lib/pagination/cursor";
import { type CreditRepository, createCreditRepository } from "./repository";

export type CreditServiceDependencies = {
	repository: CreditRepository;
};

export const createCreditService = (deps: CreditServiceDependencies) => ({
	async balance(caller: Session["user"]) {
		const row = await deps.repository.findUserCreditBalance(caller.id);
		return { balance: row?.tryoutCredits ?? 0 };
	},

	async adjust(input: { userId: string; amount: number; note?: string }) {
		const targetUser = await deps.repository.findUserCreditBalance(input.userId);
		if (!targetUser) throw new DomainError("NOT_FOUND", "User tidak ditemukan");

		const previousBalance = targetUser.tryoutCredits ?? 0;
		const newBalance = previousBalance + input.amount;

		if (newBalance < 0) throw new DomainError("BAD_REQUEST", "Kredit tidak boleh negatif");

		const note = input.note || (input.amount > 0 ? "Admin grant" : "Admin adjustment");

		const write = await deps.repository.transaction(async (repository) =>
			repository.applyCreditAdjustment({
				userId: input.userId,
				amount: input.amount,
				note,
				fallbackBalanceAfter: newBalance,
			}),
		);

		return {
			userId: input.userId,
			previousBalance,
			newBalance: write.newBalance,
			adjustment: input.amount,
		};
	},

	async find(input: { userId: string }) {
		const targetUser = await deps.repository.findUserCreditSummary(input.userId);
		if (!targetUser) throw new DomainError("NOT_FOUND", "User tidak ditemukan");

		const history = await deps.repository.listCreditHistory(input.userId);

		return { user: targetUser, history };
	},

	async packages(input: { limit?: number; after?: string; before?: string } | undefined) {
		const { limit, backward, cursor, hasCursor } = decodePageInput(input);
		const cursorId = cursor ? parseStringIdCursor(cursor) : null;

		const rows = await deps.repository.listCreditPackages({ cursorId, isBackward: backward, limit });

		return buildStringIdCursorPage(rows, limit, backward, hasCursor);
	},
});

export const creditService = createCreditService({
	repository: createCreditRepository(db),
});
