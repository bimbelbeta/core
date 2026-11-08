import { describe, expect, spyOn, test } from "bun:test";
import { DomainError } from "@/lib/domain-error";
import type { AttemptRow, ScoringAnswerRow, SubmissionAttempt } from "./repository";
import type { TryoutScoreResult } from "./scoring";
import { createSubmitService, type SubmitRepository, type SubmitServiceDependencies } from "./submit.service";

const deadline = new Date("2100-01-01");
const subtests = [
	{
		id: 1,
		tryoutId: 1,
		name: "First",
		description: null,
		duration: 30,
		questionOrder: "sequential",
		order: 1,
		scoringMap: null,
		createdAt: null,
		updatedAt: null,
	},
	{
		id: 2,
		tryoutId: 1,
		name: "Second",
		description: null,
		duration: 30,
		questionOrder: "sequential",
		order: 2,
		scoringMap: null,
		createdAt: null,
		updatedAt: null,
	},
];
const attemptRow = {
	id: 8,
	userId: "user-1",
	tryoutId: 1,
	startedAt: new Date(),
	deadline,
	completedAt: null,
	status: "ongoing" as const,
	score: null,
	submittedImageUrl: null,
	isRevoked: false,
	usedCredit: false,
	usedAccessCode: false,
	accessCodeId: null,
};
const ongoingSubtestAttempt = {
	id: 5,
	tryoutAttemptId: 8,
	subtestId: 1,
	startedAt: new Date(),
	completedAt: null,
	deadline,
	status: "ongoing" as const,
	score: null,
};
const attempt: SubmissionAttempt = {
	...(attemptRow satisfies AttemptRow),
	subtestAttempts: [ongoingSubtestAttempt],
	tryout: {
		id: 1,
		title: "Tryout",
		description: null,
		passingGrade: 600,
		category: "utbk" as const,
		status: "published" as const,
		startsAt: null,
		endsAt: null,
		createdAt: null,
		updatedAt: null,
		subtests,
	},
};

type InsertedSubtestAttempt = { tryoutAttemptId: number; subtestId: number; deadline: Date };

type ServiceRows = {
	attempts?: Array<SubmissionAttempt | undefined>;
	attempt?: SubmissionAttempt | undefined;
	expiredAttemptIds?: number[];
	failingAttemptIds?: number[];
	sweepQueries?: Array<{ now: Date; limit: number }>;
	finishedSubtestAttempts: number[];
	finishedAttempts: number[];
	savedScores: Array<{ attemptId: number; scores: TryoutScoreResult }>;
	insertedSubtestAttempts: InsertedSubtestAttempt[];
};

function makeRepository(rows: ServiceRows) {
	const pending = rows.attempts ? [...rows.attempts] : [];
	return {
		findAttemptForSubmission: async () => (pending.length > 0 ? pending.shift() : rows.attempt),
		listSubtestAttemptScoreInputs: async () => [{ id: 5, subtestId: 1, scoringMap: null }],
		listAnswersWithSelectedChoice: async (): Promise<ScoringAnswerRow[]> => [
			{ questionId: 11, selectedChoiceId: 21, selectedChoiceIds: null, essayAnswer: null, selectedChoiceCorrect: true },
		],
		listSubtestQuestionPairs: async () => [{ subtestId: 1, questionId: 11 }],
		listQuestionsForScoring: async () => [{ id: 11, type: "multiple_choice" as const, essayCorrectAnswer: null }],
		listChoiceCorrectness: async () => [],
		listExpiredOngoingAttemptIds: async (now: Date, limit: number) => {
			rows.sweepQueries = rows.sweepQueries ?? [];
			rows.sweepQueries.push({ now, limit });
			return rows.expiredAttemptIds ?? [];
		},
		finishSubtestAttempt: async (id: number) => {
			rows.finishedSubtestAttempts.push(id);
		},
		finishAttempt: async (id: number) => {
			if (rows.failingAttemptIds?.includes(id)) throw new Error("write failed");
			rows.finishedAttempts.push(id);
		},
		saveScores: async (attemptId: number, scores: TryoutScoreResult) => {
			rows.savedScores.push({ attemptId, scores });
		},
		insertSubtestAttempt: async (values: InsertedSubtestAttempt) => {
			rows.insertedSubtestAttempts.push(values);
			return { ...ongoingSubtestAttempt, ...values, id: 6 };
		},
	};
}

function makeService(rows: ServiceRows) {
	const repository: SubmitRepository = makeRepository(rows);
	const withTransaction: SubmitServiceDependencies["withTransaction"] = async (fn) =>
		fn({
			repository,
			credit: { deductCreditForTryoutAttempt: async () => ({ balanceAfter: 0 }) },
		});
	return { service: createSubmitService({ repository, withTransaction }), repository };
}

describe("tryout submission", () => {
	test("requires an active attempt for both submission workflows", async () => {
		const { service } = makeService({
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		});
		await expect(service.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Gagal menemukan pengerjaan tryout.",
		});
		await expect(service.submitTryout({ tryoutId: 1 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Gagal menemukan pengerjaan tryout.",
		});
	});

	test("rejects submission of an inactive subtest", async () => {
		const { service } = makeService({
			attempt: {
				...attempt,
				subtestAttempts: [{ ...ongoingSubtestAttempt, status: "finished" as const }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		});
		await expect(service.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Subtest tidak aktif",
		});
	});

	test("rejects an unknown subtest and a closed window", async () => {
		const { service } = makeService({
			attempt,
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		});
		await expect(service.submitSubtest({ tryoutId: 1, subtestId: 99 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Subtest tidak aktif",
		});

		const removed = makeService({
			attempt: {
				...attempt,
				subtestAttempts: [{ ...ongoingSubtestAttempt, subtestId: 3 }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		});
		await expect(removed.service.submitSubtest({ tryoutId: 1, subtestId: 3 }, "user-1")).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});

		const expired = makeService({
			attempt: { ...attempt, deadline: new Date(0) },
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		});
		await expect(expired.service.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout telah berakhir",
		});
	});

	test("moves to the next subtest, closing the current one and opening the next deadline", async () => {
		const rows: ServiceRows = {
			attempt,
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);

		const result = await service.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1");

		expect(result).toEqual({ success: true, tryoutCompleted: false, nextSubtestId: 2 });
		expect(rows.finishedSubtestAttempts).toEqual([5]);
		expect(rows.finishedAttempts).toEqual([]);
		expect(rows.savedScores).toEqual([]);
		expect(rows.insertedSubtestAttempts).toHaveLength(1);
		expect(rows.insertedSubtestAttempts[0]).toMatchObject({ tryoutAttemptId: 8, subtestId: 2 });
	});

	test("finishes the tryout on the last subtest and saves the calculated scores", async () => {
		const rows: ServiceRows = {
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService({
			...rows,
			attempt: { ...attempt, subtestAttempts: [{ ...ongoingSubtestAttempt, subtestId: 2 }] },
		});

		const result = await service.submitSubtest({ tryoutId: 1, subtestId: 2 }, "user-1");

		expect(result).toEqual({ success: true, tryoutCompleted: true, score: 1000 });
		expect(rows.finishedSubtestAttempts).toEqual([5]);
		expect(rows.finishedAttempts).toEqual([8]);
		expect(rows.savedScores).toEqual([
			{
				attemptId: 8,
				scores: {
					subtests: [{ subtestAttemptId: 5, subtestId: 1, score: 1000, correct: 1, total: 1 }],
					totalScore: 1000,
				},
			},
		]);
	});

	test("submitTryout finishes the attempt and saves the scores in one transaction", async () => {
		const rows: ServiceRows = {
			attempt,
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);

		const result = await service.submitTryout({ tryoutId: 1 }, "user-1");

		expect(result).toEqual({ success: true, score: 1000 });
		expect(rows.finishedAttempts).toEqual([8]);
		expect(rows.savedScores).toHaveLength(1);
	});

	test("finalizeExpiredAttempt finishes the attempt and persists the scores", async () => {
		const rows: ServiceRows = {
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);

		await service.finalizeExpiredAttempt(8);

		expect(rows.finishedAttempts).toEqual([8]);
		expect(rows.savedScores).toEqual([
			{
				attemptId: 8,
				scores: {
					subtests: [{ subtestAttemptId: 5, subtestId: 1, score: 1000, correct: 1, total: 1 }],
					totalScore: 1000,
				},
			},
		]);
	});

	test("sweeps expired attempts and keeps going when one fails", async () => {
		const errorLog = spyOn(console, "error").mockImplementation(() => {});
		const rows: ServiceRows = {
			expiredAttemptIds: [8, 9, 10],
			failingAttemptIds: [9],
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);
		const now = new Date("2100-01-01");

		expect(await service.sweepExpiredAttempts(now)).toEqual({ finalized: 2, failedAttemptIds: [9] });
		expect(rows.sweepQueries).toEqual([{ now, limit: 200 }]);
		expect(rows.finishedAttempts).toEqual([8, 10]);
		expect(rows.savedScores.map((s) => s.attemptId)).toEqual([8, 10]);
		expect(errorLog).toHaveBeenCalledTimes(1);
		expect(errorLog.mock.calls[0]?.[0]).toContain("9");

		errorLog.mockRestore();
	});

	test("sweeps nothing when no attempt has expired", async () => {
		const rows: ServiceRows = {
			expiredAttemptIds: [],
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);

		expect(await service.sweepExpiredAttempts()).toEqual({ finalized: 0, failedAttemptIds: [] });
		expect(rows.finishedAttempts).toEqual([]);
	});

	test("reports expected failures as DomainError", async () => {
		const { service } = makeService({
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		});
		await expect(service.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1")).rejects.toBeInstanceOf(DomainError);
	});
});
