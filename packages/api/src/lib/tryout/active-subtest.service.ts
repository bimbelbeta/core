import { db } from "@bimbelbeta/db";

async function findOngoingAttempt(tryoutId: number, userId: string) {
	return db.query.tryoutAttempt.findFirst({
		columns: { id: true },
		where: {
			tryoutId: { eq: tryoutId },
			userId: { eq: userId },
			status: { eq: "ongoing" },
		},
		with: {
			subtestAttempts: { columns: { status: true, deadline: true } },
		},
	});
}

export const createActiveSubtestService = (findAttempt: typeof findOngoingAttempt) => ({
	/**
	 * Decides whether the user may answer questions right now.
	 *
	 * Answering requires three things at once: an ongoing attempt, a subtest that is currently
	 * running, and a subtest deadline that has not passed. The deadline check compares against a
	 * fresh clock reading rather than trusting the client or a cached payload.
	 *
	 * Shared by saving an answer and toggling the ragu-ragu flag so both reject the same ways.
	 * Never throws; the status tells the procedure which message to use.
	 *
	 * @returns `active` with the attempt id to write answers against, or `no_attempt`,
	 * `no_subtest`, or `expired`.
	 */
	async find(tryoutId: number, userId: string) {
		const attempt = await findAttempt(tryoutId, userId);
		if (!attempt) return { status: "no_attempt" } as const;

		const subtest = attempt.subtestAttempts.find((item) => item.status === "ongoing");
		if (!subtest) return { status: "no_subtest" } as const;
		if (subtest.deadline && subtest.deadline < new Date()) return { status: "expired" } as const;

		return { status: "active", attemptId: attempt.id } as const;
	},
});

export const activeSubtestService = createActiveSubtestService(findOngoingAttempt);
