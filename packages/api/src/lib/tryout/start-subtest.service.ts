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

export function computeSubtestDeadline(durationMinutes: number, overallDeadline: Date, startFrom: Date = new Date()) {
	return new Date(Math.min(startFrom.getTime() + durationMinutes * 60 * 1000, overallDeadline.getTime()));
}

export const createStartSubtestService = (deps: typeof dependencies) => ({
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
