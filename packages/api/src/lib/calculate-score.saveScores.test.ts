import { describe, expect, test } from "bun:test";
import { saveScoresToDatabase, type TryoutScoreResult } from "./calculate-score";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");
type DrizzleTable = { [DRIZZLE_NAME]: string };

type MockTrx = {
	updates: Array<{ table: string; set: Record<string, unknown> }>;
	update: (table: DrizzleTable) => {
		set: (data: Record<string, unknown>) => { where: (cond: unknown) => Promise<void> };
	};
};

function makeMockTrx(): MockTrx {
	const mock: MockTrx = {
		updates: [],
		update(table) {
			return {
				set(data) {
					return {
						where(_cond) {
							mock.updates.push({ table: table[DRIZZLE_NAME], set: data });
							return Promise.resolve();
						},
					};
				},
			};
		},
	};
	return mock;
}

describe("saveScoresToDatabase", () => {
	const ATTEMPT_ID = 42;

	const scores: TryoutScoreResult = {
		subtests: [
			{ subtestAttemptId: 10, subtestId: 1, score: 800, correct: 8, total: 10 },
			{ subtestAttemptId: 11, subtestId: 2, score: 600, correct: 6, total: 10 },
		],
		totalScore: 700,
	};

	test("issues a single batched UPDATE for all subtest scores", async () => {
		const capture = makeMockTrx();
		await saveScoresToDatabase(ATTEMPT_ID, scores, capture as unknown as Parameters<typeof saveScoresToDatabase>[2]);

		const subtestUpdates = capture.updates.filter((u) => u.table === "tryout_subtest_attempt");
		expect(subtestUpdates).toHaveLength(1);
	});

	test("subtest batched UPDATE contains CASE expression for scores", async () => {
		const capture = makeMockTrx();
		await saveScoresToDatabase(ATTEMPT_ID, scores, capture as unknown as Parameters<typeof saveScoresToDatabase>[2]);

		const subtestUpdate = capture.updates.find((u) => u.table === "tryout_subtest_attempt");
		expect(subtestUpdate).toBeDefined();

		// Extract parameter values from the SQL CASE expression to verify each
		// subtestAttemptId maps to the correct score value.
		const sqlScore = subtestUpdate!.set.score as { queryChunks: unknown[] };
		const params: unknown[] = [];
		function collectParams(chunks: unknown[]): void {
			for (const chunk of chunks) {
				if (typeof chunk === "number" || typeof chunk === "string") {
					params.push(chunk);
				} else if (
					chunk &&
					typeof chunk === "object" &&
					"queryChunks" in chunk &&
					Array.isArray((chunk as { queryChunks: unknown[] }).queryChunks)
				) {
					collectParams((chunk as { queryChunks: unknown[] }).queryChunks);
				}
			}
		}
		collectParams(sqlScore.queryChunks);

		// Params are the CASE WHEN bindings: id, score, id, score, ...
		// Each WHEN clause contributes: subtestAttemptId, score (as number)
		expect(params).toEqual([10, 800, 11, 600]);
	});

	test("updates tryout attempt with total score", async () => {
		const capture = makeMockTrx();
		await saveScoresToDatabase(ATTEMPT_ID, scores, capture as unknown as Parameters<typeof saveScoresToDatabase>[2]);

		const attemptUpdate = capture.updates.find((u) => u.table === "tryout_attempt");
		expect(attemptUpdate).toBeDefined();
		expect(attemptUpdate?.set.score).toBe(700);
	});

	test("handles zero subtests — only updates the tryout attempt", async () => {
		const emptyScores: TryoutScoreResult = { subtests: [], totalScore: 0 };
		const capture = makeMockTrx();
		await saveScoresToDatabase(
			ATTEMPT_ID,
			emptyScores,
			capture as unknown as Parameters<typeof saveScoresToDatabase>[2],
		);

		expect(capture.updates.filter((u) => u.table === "tryout_subtest_attempt")).toHaveLength(0);
		const attemptUpdate = capture.updates.find((u) => u.table === "tryout_attempt");
		expect(attemptUpdate?.set.score).toBe(0);
	});
});
