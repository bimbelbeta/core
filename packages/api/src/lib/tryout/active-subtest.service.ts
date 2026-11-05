import { db } from "@bimbelbeta/db";
import { tryoutErrors as errors } from "@/lib/tryout/tryout-error";

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

export const createActiveSubtestService = (deps: { findAttempt: typeof findOngoingAttempt }) => ({
	/**
	 * Decides whether the user may answer questions right now.
	 *
	 * Answering requires three things at once: an ongoing attempt, a subtest that is currently
	 * running, and a subtest deadline that has not passed. The deadline check compares against a
	 * fresh clock reading rather than trusting the client or a cached payload.
	 *
	 * Shared by saving an answer and toggling the ragu-ragu flag so both reject the same ways.
	 * Throws a `TryoutError` for every expected rejection.
	 *
	 * @returns The attempt id to write answers against.
	 */
	async require(tryoutId: number, userId: string) {
		const attempt = await deps.findAttempt(tryoutId, userId);
		if (!attempt) throw errors.BAD_REQUEST({ message: "Tidak ada pengerjaan yang aktif" });

		const subtest = attempt.subtestAttempts.find((item) => item.status === "ongoing");
		if (!subtest) throw errors.BAD_REQUEST({ message: "Tidak ada subtest yang aktif" });
		if (subtest.deadline && subtest.deadline < new Date()) {
			throw errors.BAD_REQUEST({ message: "Batas waktu subtest telah habis" });
		}

		return attempt.id;
	},
});

export const activeSubtestService = createActiveSubtestService({ findAttempt: findOngoingAttempt });
