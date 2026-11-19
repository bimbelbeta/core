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
	attemptNumber: 1,
	startedAt: new Date(),
	deadline,
	completedAt: null,
	breakEndsAt: null,
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
	autoSubmitted: false,
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

type InsertedSubtestAttempt = {
	tryoutAttemptId: number;
	subtestId: number;
	deadline: Date;
	startedAt?: Date;
	status?: "not_started" | "ongoing" | "finished";
	completedAt?: Date | null;
	autoSubmitted?: boolean;
};

type FinishOptions = { completedAt?: Date; autoSubmitted?: boolean };

type ServiceRows = {
	attempts?: Array<SubmissionAttempt | undefined>;
	attempt?: SubmissionAttempt | undefined;
	attemptById?: SubmissionAttempt | undefined;
	expiredAttemptIds?: number[];
	failingAttemptIds?: number[];
	sweepQueries?: Array<{ now: Date; limit: number }>;
	lockedCalls?: number;
	lockedByIdCalls?: number[];
	finishedSubtestAttempts: number[];
	finishedSubtestDetails?: Array<{ id: number; options?: FinishOptions }>;
	finishedAttempts: number[];
	finishedAttemptDetails?: Array<{ id: number; options?: FinishOptions }>;
	savedScores: Array<{ attemptId: number; scores: TryoutScoreResult }>;
	insertedSubtestAttempts: InsertedSubtestAttempt[];
	breakUpdates?: Array<{ attemptId: number; breakEndsAt: Date | null; deadline: Date }>;
	scoreInputs?: Array<{ id: number; subtestId: number; scoringMap: Record<string, number> | null }>;
	questionPairs?: Array<{ subtestId: number; questionId: number }>;
};

function makeRepository(rows: ServiceRows): SubmitRepository {
	const pending = rows.attempts ? [...rows.attempts] : [];
	return {
		lockAttemptForUpdate: async () => {
			rows.lockedCalls = (rows.lockedCalls ?? 0) + 1;
			return rows.attempt;
		},
		lockAttemptByIdForUpdate: async (id: number) => {
			rows.lockedByIdCalls = rows.lockedByIdCalls ?? [];
			rows.lockedByIdCalls.push(id);
			return rows.attemptById ?? rows.attempt;
		},
		findAttemptForSubmission: async () => (pending.length > 0 ? pending.shift() : rows.attempt),
		findAttemptForSubmissionById: async () => rows.attemptById ?? rows.attempt,
		listSubtestAttemptScoreInputs: async () => rows.scoreInputs ?? [{ id: 5, subtestId: 1, scoringMap: null }],
		listAnswersWithSelectedChoice: async (): Promise<ScoringAnswerRow[]> => [
			{ questionId: 11, selectedChoiceId: 21, selectedChoiceIds: null, essayAnswer: null, selectedChoiceCorrect: true },
		],
		listSubtestQuestionPairs: async () => rows.questionPairs ?? [{ subtestId: 1, questionId: 11 }],
		listQuestionsForScoring: async () => [
			{ id: 11, type: "multiple_choice" as const, essayCorrectAnswer: null },
			{ id: 12, type: "multiple_choice" as const, essayCorrectAnswer: null },
		],
		listChoiceCorrectness: async () => [],
		listExpiredOngoingAttemptIds: async (now: Date, limit: number) => {
			rows.sweepQueries = rows.sweepQueries ?? [];
			rows.sweepQueries.push({ now, limit });
			return rows.expiredAttemptIds ?? [];
		},
		finishSubtestAttempt: async (id: number, options?: FinishOptions) => {
			rows.finishedSubtestAttempts.push(id);
			rows.finishedSubtestDetails = rows.finishedSubtestDetails ?? [];
			rows.finishedSubtestDetails.push({ id, options });
		},
		finishAttempt: async (id: number, options?: FinishOptions) => {
			if (rows.failingAttemptIds?.includes(id)) throw new Error("write failed");
			rows.finishedAttempts.push(id);
			rows.finishedAttemptDetails = rows.finishedAttemptDetails ?? [];
			rows.finishedAttemptDetails.push({ id, options });
		},
		saveScores: async (attemptId: number, scores: TryoutScoreResult) => {
			rows.savedScores.push({ attemptId, scores });
		},
		insertSubtestAttempts: async (values: InsertedSubtestAttempt[]) => {
			rows.insertedSubtestAttempts.push(...values);
			return values.map((v, i) => ({ ...ongoingSubtestAttempt, ...v, id: 6 + i }));
		},
		updateAttemptBreakAndDeadline: async (attemptId: number, breakEndsAt: Date | null, deadline: Date) => {
			rows.breakUpdates = rows.breakUpdates ?? [];
			rows.breakUpdates.push({ attemptId, breakEndsAt, deadline });
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
				subtestAttempts: [{ ...ongoingSubtestAttempt, status: "not_started" as const }],
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

	test("rejects unknown, removed, or revoked attempts", async () => {
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
			code: "BAD_REQUEST",
			message: "Subtest tidak aktif",
		});

		const revoked = makeService({
			attempt: { ...attempt, isRevoked: true },
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		});
		await expect(revoked.service.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1")).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Pengerjaan telah dibatalkan",
		});
	});

	test("moves to 60s break on manual submit without inserting the next subtest row", async () => {
		const submitNow = new Date("2026-01-01T10:10:00.000Z");
		const expectedBreak = new Date("2026-01-01T10:11:00.000Z");
		const expectedOverall = new Date("2026-01-01T10:41:00.000Z");
		const rows: ServiceRows = {
			attempt,
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);

		const result = await service.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1", submitNow);

		expect(result).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: 2,
			breakDeadline: expectedBreak,
			autoCompletedByTimer: false,
		});
		expect(rows.lockedCalls).toBe(1);
		expect(rows.finishedSubtestAttempts).toEqual([5]);
		expect(rows.finishedSubtestDetails?.[0]?.options?.autoSubmitted).toBe(false);
		expect(rows.breakUpdates).toEqual([{ attemptId: 8, breakEndsAt: expectedBreak, deadline: expectedOverall }]);
		expect(rows.finishedAttempts).toEqual([]);
		expect(rows.savedScores).toEqual([]);
		expect(rows.insertedSubtestAttempts).toEqual([]);
	});

	test("finishes the tryout on the last subtest and saves the calculated scores", async () => {
		const rows: ServiceRows = {
			attempt: { ...attempt, subtestAttempts: [{ ...ongoingSubtestAttempt, subtestId: 2 }] },
			finishedSubtestAttempts: [],
			finishedSubtestDetails: [],
			finishedAttempts: [],
			finishedAttemptDetails: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);

		const result = await service.submitSubtest({ tryoutId: 1, subtestId: 2 }, "user-1");

		expect(result).toEqual({ success: true, tryoutCompleted: true, score: 1000, autoCompletedByTimer: false });
		expect(rows.finishedSubtestAttempts).toEqual([5]);
		expect(rows.finishedSubtestDetails?.[0]?.options?.autoSubmitted).toBe(false);
		expect(rows.finishedAttempts).toEqual([8]);
		expect(rows.finishedAttemptDetails?.[0]?.options?.autoSubmitted).toBe(true);
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

	test("marks timeout submit autoSubmitted=true, enters break or chain-advances, and succeeds past attempt.deadline", async () => {
		const subtestDeadline = new Date("2026-01-01T10:30:00.000Z");
		const attemptDeadline = new Date("2026-01-01T11:01:00.000Z");

		const withinBreakRows: ServiceRows = {
			attempt: {
				...attempt,
				deadline: attemptDeadline,
				subtestAttempts: [{ ...ongoingSubtestAttempt, deadline: subtestDeadline }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const withinBreakResult = await makeService(withinBreakRows).service.submitSubtest(
			{ tryoutId: 1, subtestId: 1 },
			"user-1",
			new Date("2026-01-01T10:30:20.000Z"),
		);
		expect(withinBreakResult).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: 2,
			breakDeadline: new Date("2026-01-01T10:31:00.000Z"),
			autoCompletedByTimer: true,
		});
		expect(withinBreakRows.insertedSubtestAttempts).toEqual([]);

		const lateNonFinal = new Date("2026-01-01T10:35:00.000Z");
		const nonFinalRows: ServiceRows = {
			attempt: {
				...attempt,
				deadline: attemptDeadline,
				subtestAttempts: [{ ...ongoingSubtestAttempt, deadline: subtestDeadline }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const nonFinalService = makeService(nonFinalRows).service;
		const nonFinalResult = await nonFinalService.submitSubtest({ tryoutId: 1, subtestId: 1 }, "user-1", lateNonFinal);
		expect(nonFinalResult).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: 2,
			breakDeadline: null,
			autoCompletedByTimer: true,
		});
		expect(nonFinalRows.finishedSubtestDetails).toEqual([
			{ id: 5, options: { completedAt: subtestDeadline, autoSubmitted: true } },
		]);
		expect(nonFinalRows.insertedSubtestAttempts[0]).toMatchObject({
			tryoutAttemptId: 8,
			subtestId: 2,
			startedAt: new Date("2026-01-01T10:31:00.000Z"),
			deadline: attemptDeadline,
			status: "ongoing",
		});

		const finalDeadline = new Date("2026-01-01T11:01:00.000Z");
		const pastAttemptDeadline = new Date("2026-01-01T11:15:00.000Z");
		const finalRows: ServiceRows = {
			attempt: {
				...attempt,
				deadline: attemptDeadline,
				subtestAttempts: [{ ...ongoingSubtestAttempt, subtestId: 2, deadline: finalDeadline }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const finalResult = await makeService(finalRows).service.submitSubtest(
			{ tryoutId: 1, subtestId: 2 },
			"user-1",
			pastAttemptDeadline,
		);
		expect(finalResult).toEqual({ success: true, tryoutCompleted: true, score: 1000, autoCompletedByTimer: true });
		expect(finalRows.finishedSubtestDetails).toEqual([
			{ id: 5, options: { completedAt: finalDeadline, autoSubmitted: true } },
		]);
		expect(finalRows.finishedAttemptDetails).toEqual([
			{ id: 8, options: { completedAt: finalDeadline, autoSubmitted: true } },
		]);
	});

	test("returns idempotent result with zero writes when retrying manual or timeout submit", async () => {
		const breakEndsAt = new Date("2026-01-01T10:31:00.000Z");
		const nonFinalRows: ServiceRows = {
			attempt: {
				...attempt,
				breakEndsAt,
				subtestAttempts: [{ ...ongoingSubtestAttempt, status: "finished", autoSubmitted: true }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const retryDuringBreak = await makeService(nonFinalRows).service.submitSubtest(
			{ tryoutId: 1, subtestId: 1 },
			"user-1",
			new Date("2026-01-01T10:30:30.000Z"),
		);
		expect(retryDuringBreak).toEqual({
			success: true,
			tryoutCompleted: false,
			nextSubtestId: 2,
			breakDeadline: breakEndsAt,
			autoCompletedByTimer: true,
		});
		expect(nonFinalRows.finishedSubtestAttempts).toEqual([]);
		expect(nonFinalRows.insertedSubtestAttempts).toEqual([]);
		expect(nonFinalRows.breakUpdates).toBeUndefined();

		const manualFinalRows: ServiceRows = {
			attempt: {
				...attempt,
				status: "finished",
				score: "850",
				subtestAttempts: [
					{ ...ongoingSubtestAttempt, status: "finished", autoSubmitted: false },
					{ ...ongoingSubtestAttempt, id: 6, subtestId: 2, status: "finished", autoSubmitted: false },
				],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const retryFinalManual = await makeService(manualFinalRows).service.submitSubtest(
			{ tryoutId: 1, subtestId: 2 },
			"user-1",
		);
		expect(retryFinalManual).toEqual({
			success: true,
			tryoutCompleted: true,
			score: 850,
			autoCompletedByTimer: false,
		});
		expect(manualFinalRows.finishedSubtestAttempts).toEqual([]);
		expect(manualFinalRows.finishedAttempts).toEqual([]);
		expect(manualFinalRows.savedScores).toEqual([]);
	});

	test("reconcileFindAttempt locks, enters break, chain-advances, and avoids duplicate writes", async () => {
		const subtestDeadline = new Date("2026-01-01T10:30:00.000Z");
		const breakRows: ServiceRows = {
			attempt: {
				...attempt,
				deadline: new Date("2026-01-01T11:01:00.000Z"),
				subtestAttempts: [{ ...ongoingSubtestAttempt, deadline: subtestDeadline }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const reconciledBreak = await makeService(breakRows).service.reconcileFindAttempt(
			1,
			"user-1",
			new Date("2026-01-01T10:30:20.000Z"),
		);
		expect(breakRows.lockedCalls).toBe(1);
		expect(reconciledBreak.phase).toEqual({
			phase: "break",
			nextSubtestId: 2,
			breakEndsAt: new Date("2026-01-01T10:31:00.000Z"),
			autoSubmittedSubtestId: 1,
		});
		expect(breakRows.breakUpdates).toEqual([
			{
				attemptId: 8,
				breakEndsAt: new Date("2026-01-01T10:31:00.000Z"),
				deadline: new Date("2026-01-01T11:01:00.000Z"),
			},
		]);

		const expiredRows: ServiceRows = {
			attempt: {
				...attempt,
				deadline: new Date("2026-01-01T11:01:00.000Z"),
				subtestAttempts: [{ ...ongoingSubtestAttempt, deadline: subtestDeadline }],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const reconciled = await makeService(expiredRows).service.reconcileFindAttempt(
			1,
			"user-1",
			new Date("2026-01-01T10:35:00.000Z"),
		);
		expect(expiredRows.lockedCalls).toBe(1);
		expect(reconciled.phase).toEqual({
			phase: "ongoing_subtest",
			subtestId: 2,
			startedAt: new Date("2026-01-01T10:31:00.000Z"),
			deadline: new Date("2026-01-01T11:01:00.000Z"),
		});
		expect(expiredRows.insertedSubtestAttempts).toHaveLength(1);

		const raceRows: ServiceRows = {
			attempt: {
				...attempt,
				deadline: new Date("2026-01-01T11:01:00.000Z"),
				subtestAttempts: [
					{ ...ongoingSubtestAttempt, status: "finished", autoSubmitted: true },
					{ ...ongoingSubtestAttempt, id: 6, subtestId: 2, deadline: new Date("2026-01-01T10:50:00.000Z") },
				],
			},
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const raced = await makeService(raceRows).service.reconcileFindAttempt(
			1,
			"user-1",
			new Date("2026-01-01T10:35:00.000Z"),
		);
		expect(raced.phase.phase).toBe("ongoing_subtest");
		expect(raceRows.finishedSubtestAttempts).toEqual([]);
		expect(raceRows.insertedSubtestAttempts).toEqual([]);
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
		expect(rows.finishedAttemptDetails).toEqual([{ id: 8, options: undefined }]);
		expect(rows.savedScores).toHaveLength(1);
	});

	test("finalizeExpiredAttempt inserts missing subtests before scoring across all subtests", async () => {
		const rows: ServiceRows = {
			attemptById: {
				...attempt,
				deadline: new Date("2026-01-01T11:01:00.000Z"),
				subtestAttempts: [{ ...ongoingSubtestAttempt, deadline: new Date("2026-01-01T10:30:00.000Z") }],
			},
			scoreInputs: [
				{ id: 5, subtestId: 1, scoringMap: null },
				{ id: 6, subtestId: 2, scoringMap: null },
			],
			questionPairs: [
				{ subtestId: 1, questionId: 11 },
				{ subtestId: 2, questionId: 12 },
			],
			finishedSubtestAttempts: [],
			finishedAttempts: [],
			savedScores: [],
			insertedSubtestAttempts: [],
		};
		const { service } = makeService(rows);

		await service.finalizeExpiredAttempt(8);

		expect(rows.lockedByIdCalls).toEqual([8]);
		expect(rows.insertedSubtestAttempts).toMatchObject([
			{ tryoutAttemptId: 8, subtestId: 2, status: "finished", autoSubmitted: true },
		]);
		expect(rows.finishedAttempts).toEqual([8]);
		expect(rows.finishedAttemptDetails).toEqual([
			{ id: 8, options: { completedAt: expect.any(Date), autoSubmitted: true } },
		]);
		expect(rows.savedScores).toEqual([
			{
				attemptId: 8,
				scores: {
					subtests: [
						{ subtestAttemptId: 5, subtestId: 1, score: 1000, correct: 1, total: 1 },
						{ subtestAttemptId: 6, subtestId: 2, score: 0, correct: 0, total: 1 },
					],
					totalScore: 500,
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
