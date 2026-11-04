import { db } from "@bimbelbeta/db";
import { tryoutSubtestAttempt } from "@bimbelbeta/db/schema/tryout";
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
	createSubtestAttempt: async (data: typeof tryoutSubtestAttempt.$inferInsert) => {
		const [attempt] = await db.insert(tryoutSubtestAttempt).values(data).returning();
		return attempt;
	},
};

/**
 * Computes when a subtest must end, honouring both limits at once.
 *
 * A subtest has its own duration but can never run past the overall tryout deadline, so the
 * result is the earlier of the two. `startFrom` is the previous subtest's deadline, which chains
 * subtests back to back without idle time; it defaults to now for the first subtest.
 */
export function computeSubtestDeadline(durationMinutes: number, overallDeadline: Date, startFrom: Date = new Date()) {
	return new Date(Math.min(startFrom.getTime() + durationMinutes * 60 * 1000, overallDeadline.getTime()));
}

export const createStartSubtestService = (deps: typeof dependencies) => ({
	/**
	 * Opens the user's attempt at one subtest, or returns the attempt they already have.
	 *
	 * Subtests are sequential: a subtest can only start once the previous one is finished, which
	 * is why the previous attempt is checked before anything is written. Returning the existing
	 * attempt makes the endpoint safe to retry after a page reload.
	 *
	 * Never throws; the returned status tells the procedure which error to raise.
	 *
	 * @returns `started` with the subtest attempt and normalized score, or `no_attempt`,
	 * `no_tryout`, `no_subtest`, `previous_unfinished`, `no_deadline`, or `creation_failed`.
	 */
	async start(tryoutId: number, subtestId: number, userId: string) {
		const attempt = await deps.findAttempt(tryoutId, userId);
		if (!attempt) return { status: "no_attempt" } as const;

		const existing = attempt.subtestAttempts.find((item) => item.subtestId === subtestId);
		if (existing)
			return { status: "started", attempt: { ...existing, score: parseNullableInt(existing.score) } } as const;
		if (!attempt.tryout) return { status: "no_tryout" } as const;

		const index = attempt.tryout.subtests.findIndex((item) => item.id === subtestId);
		if (index === -1) return { status: "no_subtest" } as const;

		const previous =
			index > 0
				? attempt.subtestAttempts.find((item) => item.subtestId === attempt.tryout?.subtests[index - 1]?.id)
				: undefined;
		if (index > 0 && previous?.status !== "finished") return { status: "previous_unfinished" } as const;
		if (previous && !previous.deadline) return { status: "no_deadline" } as const;

		const startFrom = previous?.deadline ?? new Date();
		const deadline = computeSubtestDeadline(attempt.tryout.subtests[index]!.duration, attempt.deadline, startFrom);
		const created = await deps.createSubtestAttempt({ tryoutAttemptId: attempt.id, subtestId, deadline });
		if (!created) return { status: "creation_failed" } as const;
		return { status: "started", attempt: { ...created, score: parseNullableInt(created.score) } } as const;
	},
});

export const startSubtestService = createStartSubtestService(dependencies);
