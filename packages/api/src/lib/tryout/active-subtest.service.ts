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
