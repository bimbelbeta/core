import { db } from "@bimbelbeta/db";
import { tryoutSubtestAttempt } from "@bimbelbeta/db/schema/tryout";
import { computeSubtestDeadline } from "@/lib/tryout/deadline";
import { tryoutErrors as errors } from "@/lib/tryout/tryout-error";
import { parseNullableInt } from "@/lib/utils";

const dependencies = {
	findAttempt: async (tryoutId: number, userId: string) =>
		db.query.tryoutAttempt.findFirst({
			columns: { id: true, deadline: true },
			where: { tryoutId: { eq: tryoutId }, userId: { eq: userId } },
			with: {
				subtestAttempts: true,
				tryout: {
					columns: { id: true },
					with: { subtests: { orderBy: (subtests, { asc }) => [asc(subtests.order)] } },
				},
			},
		}),
	createSubtestAttempt: async (data: typeof tryoutSubtestAttempt.$inferInsert) =>
		(await db.insert(tryoutSubtestAttempt).values(data).returning())[0]!,
};

export const createStartSubtestService = (deps: typeof dependencies) => ({
	/**
	 * Opens the user's attempt at one subtest, or returns the attempt they already have.
	 *
	 * Subtests are sequential: a subtest can only start once the previous one is finished, which
	 * is why the previous attempt is checked before anything is written. Returning the existing
	 * attempt makes the endpoint safe to retry after a page reload.
	 *
	 * Throws a `TryoutError` for every expected rejection.
	 *
	 * @returns The subtest attempt with its score normalized to a number.
	 */
	async start(tryoutId: number, subtestId: number, userId: string) {
		const attempt = await deps.findAttempt(tryoutId, userId);
		if (!attempt) throw errors.BAD_REQUEST({ message: "Anda belum memulai tryout ini" });

		const existing = attempt.subtestAttempts.find((item) => item.subtestId === subtestId);
		if (existing) return { ...existing, score: parseNullableInt(existing.score) };
		if (!attempt.tryout) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

		const index = attempt.tryout.subtests.findIndex((item) => item.id === subtestId);
		if (index === -1) throw errors.NOT_FOUND({ message: "Subtest tidak ditemukan" });

		const previous =
			index > 0
				? attempt.subtestAttempts.find((item) => item.subtestId === attempt.tryout?.subtests[index - 1]?.id)
				: undefined;
		if (index > 0 && previous?.status !== "finished") {
			throw errors.BAD_REQUEST({ message: "Selesaikan subtest sebelumnya terlebih dahulu" });
		}
		if (previous && !previous.deadline) {
			throw errors.BAD_REQUEST({ message: "Pengerjaan tidak memiliki batas waktu" });
		}

		const startFrom = previous?.deadline ?? new Date();
		const deadline = computeSubtestDeadline(attempt.tryout.subtests[index]!.duration, attempt.deadline, startFrom);
		const created = await deps.createSubtestAttempt({ tryoutAttemptId: attempt.id, subtestId, deadline });
		return { ...created, score: parseNullableInt(created.score) };
	},
});

export const startSubtestService = createStartSubtestService(dependencies);
