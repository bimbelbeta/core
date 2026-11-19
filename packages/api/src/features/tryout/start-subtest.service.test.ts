import { describe, expect, test } from "bun:test";
import { DomainError } from "@/lib/domain-error";
import type { ScoringAnswerRow, SubtestAttemptInsert, SubtestAttemptRow, SubtestStartAttempt } from "./repository";
import type { TryoutScoreResult } from "./scoring";
import {
	createStartSubtestService,
	type StartSubtestDependencies,
	type StartSubtestRepository,
} from "./start-subtest.service";

const base = new Date("2026-01-01T10:00:00.000Z");
const atMinutes = (minutes: number) => new Date(base.getTime() + minutes * 60_000);
const subtest = {
	id: 10,
	tryoutId: 1,
	name: "Subtest",
	description: null,
	duration: 30,
	questionOrder: "sequential",
	order: 1,
	scoringMap: null,
	createdAt: null,
	updatedAt: null,
};
const subtestAttempt: SubtestAttemptRow = {
	id: 5,
	tryoutAttemptId: 2,
	subtestId: 10,
	startedAt: base,
	completedAt: atMinutes(20),
	deadline: atMinutes(30),
	status: "finished",
	score: "75",
	autoSubmitted: false,
};
const attempt: SubtestStartAttempt = {
	id: 2,
	status: "ongoing",
	deadline: atMinutes(61),
	breakEndsAt: atMinutes(21),
	isRevoked: false,
	subtestAttempts: [subtestAttempt],
	tryout: { id: 1, subtests: [subtest, { ...subtest, id: 11, order: 2 }] },
};

type StartRows = {
	attempts?: Array<SubtestStartAttempt | undefined>;
	attempt?: SubtestStartAttempt | undefined;
	lockedCalls?: number;
	inserted: SubtestAttemptInsert[];
	breakUpdates: Array<{ attemptId: number; breakEndsAt: Date | null; deadline: Date }>;
	finishedSubtests: Array<{ id: number; completedAt?: Date; autoSubmitted?: boolean }>;
	finishedAttempts: number[];
	savedScores: Array<{ attemptId: number; scores: TryoutScoreResult }>;
	insertedScore?: string | null;
};

function makeService(rows: StartRows) {
	const pending = rows.attempts ? [...rows.attempts] : [];
	const repository: StartSubtestRepository = {
		lockAttemptForUpdate: async () => {
			rows.lockedCalls = (rows.lockedCalls ?? 0) + 1;
			return undefined;
		},
		findAttemptForSubtestStart: async () => (pending.length > 0 ? pending.shift() : rows.attempt),
		insertSubtestAttempts: async (values) => {
			rows.inserted.push(...values);
			return values.map((value, index) => ({
				id: 6 + index,
				tryoutAttemptId: value.tryoutAttemptId,
				subtestId: value.subtestId,
				startedAt: value.startedAt ?? base,
				completedAt: value.completedAt ?? null,
				deadline: value.deadline,
				status: value.status ?? "ongoing",
				score: rows.insertedScore ?? null,
				autoSubmitted: value.autoSubmitted ?? false,
			}));
		},
		updateAttemptBreakAndDeadline: async (attemptId, breakEndsAt, deadline) => {
			rows.breakUpdates.push({ attemptId, breakEndsAt, deadline });
		},
		finishSubtestAttempt: async (id, options) => {
			rows.finishedSubtests.push({ id, ...options });
		},
		finishAttempt: async (id) => {
			rows.finishedAttempts.push(id);
		},
		listSubtestAttemptScoreInputs: async () => [
			{ id: 5, subtestId: 10, scoringMap: null },
			{ id: 6, subtestId: 11, scoringMap: null },
		],
		listAnswersWithSelectedChoice: async (): Promise<ScoringAnswerRow[]> => [
			{ questionId: 1, selectedChoiceId: 2, selectedChoiceIds: null, essayAnswer: null, selectedChoiceCorrect: true },
		],
		listSubtestQuestionPairs: async () => [
			{ subtestId: 10, questionId: 1 },
			{ subtestId: 11, questionId: 2 },
		],
		listQuestionsForScoring: async () => [
			{ id: 1, type: "multiple_choice", essayCorrectAnswer: null },
			{ id: 2, type: "multiple_choice", essayCorrectAnswer: null },
		],
		listChoiceCorrectness: async () => [],
		saveScores: async (attemptId, scores) => {
			rows.savedScores.push({ attemptId, scores });
		},
	};
	const withTransaction: NonNullable<StartSubtestDependencies["withTransaction"]> = async (fn) =>
		fn({
			repository,
			credit: { deductCreditForTryoutAttempt: async () => ({ balanceAfter: 0 }) },
		});
	return createStartSubtestService({ repository, withTransaction });
}

function baseRows(overrides: Partial<StartRows> = {}): StartRows {
	return {
		attempt,
		inserted: [],
		breakUpdates: [],
		finishedSubtests: [],
		finishedAttempts: [],
		savedScores: [],
		...overrides,
	};
}

describe("start subtest service", () => {
	test("locks attempt and returns an existing subtest attempt idempotently", async () => {
		const rows = baseRows();
		const service = makeService(rows);
		expect(await service.start(1, 10, "user", atMinutes(20))).toEqual({ ...subtestAttempt, score: 75 });
		expect(rows.lockedCalls).toBe(1);
		expect(rows.inserted).toEqual([]);
		expect(rows.breakUpdates).toEqual([]);
	});

	test("allows early skip-break during break, clears breakEndsAt, and shrinks overallDeadline", async () => {
		const rows = baseRows({ insertedScore: "75" });
		const service = makeService(rows);
		const now = new Date(atMinutes(20).getTime() + 20_000);
		const created = await service.start(1, 11, "user", now);

		expect(rows.lockedCalls).toBe(1);
		expect(rows.inserted).toEqual([
			{
				tryoutAttemptId: 2,
				subtestId: 11,
				startedAt: now,
				deadline: new Date(now.getTime() + 30 * 60_000),
				status: "ongoing",
				completedAt: null,
				autoSubmitted: false,
			},
		]);
		expect(rows.breakUpdates).toEqual([
			{ attemptId: 2, breakEndsAt: null, deadline: new Date(now.getTime() + 30 * 60_000) },
		]);
		expect(created.score).toBe(75);
	});

	test("starts from breakEndsAt when break already elapsed", async () => {
		const rows = baseRows();
		const service = makeService(rows);
		await service.start(1, 11, "user", atMinutes(25));

		expect(rows.inserted).toEqual([
			{
				tryoutAttemptId: 2,
				subtestId: 11,
				startedAt: atMinutes(21),
				deadline: atMinutes(51),
				status: "ongoing",
				completedAt: null,
				autoSubmitted: false,
			},
		]);
		expect(rows.breakUpdates).toEqual([{ attemptId: 2, breakEndsAt: null, deadline: atMinutes(51) }]);
	});

	test("finishes and scores attempt when offline time expired the target subtest too", async () => {
		const rows = baseRows();
		const service = makeService(rows);
		const created = await service.start(1, 11, "user", atMinutes(120));

		expect(created).toMatchObject({ subtestId: 11, status: "finished", autoSubmitted: true, score: 0 });
		expect(rows.finishedAttempts).toEqual([2]);
		expect(rows.savedScores).toEqual([
			{
				attemptId: 2,
				scores: {
					subtests: [
						{ subtestAttemptId: 5, subtestId: 10, score: 1000, correct: 1, total: 1 },
						{ subtestAttemptId: 6, subtestId: 11, score: 0, correct: 0, total: 1 },
					],
					totalScore: 500,
				},
			},
		]);
	});

	test("rejects missing, revoked, missing-tryout, finished, unknown-subtest, and out-of-order starts", async () => {
		const missing = makeService(baseRows({ attempt: undefined }));
		await expect(missing.start(1, 10, "user", base)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Anda belum memulai tryout ini",
		});

		const revoked = makeService(baseRows({ attempt: { ...attempt, isRevoked: true } }));
		await expect(revoked.start(1, 11, "user", base)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Pengerjaan telah dibatalkan",
		});

		const noTryout = makeService(baseRows({ attempt: { ...attempt, tryout: null, subtestAttempts: [] } }));
		await expect(noTryout.start(1, 10, "user", base)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});

		const service = makeService(
			baseRows({
				attempts: [
					attempt,
					{ ...attempt, status: "finished" },
					{
						...attempt,
						breakEndsAt: null,
						subtestAttempts: [{ ...subtestAttempt, status: "ongoing", completedAt: null, deadline: atMinutes(30) }],
					},
				],
			}),
		);
		await expect(service.start(1, 99, "user", atMinutes(21))).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});
		await expect(service.start(1, 11, "user", atMinutes(70))).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout telah berakhir",
		});
		await expect(service.start(1, 11, "user", atMinutes(10))).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Selesaikan subtest sebelumnya terlebih dahulu",
		});
		await expect(missing.start(1, 10, "user", base)).rejects.toBeInstanceOf(DomainError);
	});
});
