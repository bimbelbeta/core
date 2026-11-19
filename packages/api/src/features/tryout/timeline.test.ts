import { describe, expect, test } from "bun:test";
import {
	type AttemptTimelineInput,
	computeOverallDeadline,
	INTER_SUBTEST_BREAK_MS,
	planMissingSubtestsForFinalization,
	planStartSubtest,
	planSubmitSubtest,
	reconcileTimeline,
	type SubtestSchedule,
} from "./timeline";

const BASE = new Date("2026-01-01T10:00:00.000Z");

function atMinutes(minutes: number) {
	return new Date(BASE.getTime() + minutes * 60_000);
}

function atSeconds(seconds: number) {
	return new Date(BASE.getTime() + seconds * 1_000);
}

function atMs(ms: number) {
	return new Date(BASE.getTime() + ms);
}

const FOUR_SUBTESTS: SubtestSchedule[] = [
	{ id: 1, order: 1, durationMinutes: 15 },
	{ id: 2, order: 2, durationMinutes: 15 },
	{ id: 3, order: 3, durationMinutes: 15 },
	{ id: 4, order: 4, durationMinutes: 15 },
];

describe("computeOverallDeadline", () => {
	test("uses 60-second inter-subtest break constant", () => {
		expect(INTER_SUBTEST_BREAK_MS).toBe(60_000);
	});

	test("sums durations and n-1 breaks for remaining subtests", () => {
		expect(computeOverallDeadline(BASE, FOUR_SUBTESTS)).toEqual(atMinutes(63));
		expect(computeOverallDeadline(BASE, [FOUR_SUBTESTS[0]!])).toEqual(atMinutes(15));
		expect(computeOverallDeadline(BASE, [])).toEqual(BASE);
	});
});

describe("reconcileTimeline", () => {
	test("returns finished with null autoSubmittedSubtestId when attempt is already finished", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "finished",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 4,
					startedAt: atMinutes(48),
					deadline: atMinutes(63),
					completedAt: atMinutes(63),
					status: "finished",
					autoSubmitted: true,
				},
			],
		};

		expect(reconcileTimeline(input, atMinutes(70))).toEqual({
			mutations: [],
			phase: { phase: "finished", autoSubmittedSubtestId: null },
		});
	});

	test("returns zero mutations 1ms before ongoing subtest deadline", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		expect(reconcileTimeline(input, atMs(15 * 60_000 - 1))).toEqual({
			mutations: [],
			phase: {
				phase: "ongoing_subtest",
				subtestId: 1,
				startedAt: BASE,
				deadline: atMinutes(15),
			},
		});
	});

	test("expires ongoing subtest at exact 0-second boundary into 60s break and preserves autoSubmittedSubtestId during break", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const initial = reconcileTimeline(input, atMinutes(15));
		expect(initial).toEqual({
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(15),
					autoSubmitted: true,
				},
				{
					kind: "set_break",
					breakEndsAt: atMinutes(16),
					overallDeadline: atMinutes(63),
				},
			],
			phase: {
				phase: "break",
				nextSubtestId: 2,
				breakEndsAt: atMinutes(16),
				autoSubmittedSubtestId: 1,
			},
		});

		const persistedBreakInput: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: atMinutes(16),
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: atMinutes(15),
					status: "finished",
					autoSubmitted: true,
				},
			],
		};

		const steadyBreak = reconcileTimeline(persistedBreakInput, atSeconds(15 * 60 + 30));
		expect(steadyBreak).toEqual({
			mutations: [],
			phase: {
				phase: "break",
				nextSubtestId: 2,
				breakEndsAt: atMinutes(16),
				autoSubmittedSubtestId: 1,
			},
		});

		const breakEnded = reconcileTimeline(persistedBreakInput, atMinutes(16));
		expect(breakEnded).toEqual({
			mutations: [
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(16),
					deadline: atMinutes(31),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atMinutes(63),
				},
			],
			phase: {
				phase: "ongoing_subtest",
				subtestId: 2,
				startedAt: atMinutes(16),
				deadline: atMinutes(31),
			},
		});
	});

	test("keeps autoSubmittedSubtestId null during break after manual submit", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(58),
			breakEndsAt: atMinutes(11),
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: atMinutes(10),
					status: "finished",
					autoSubmitted: false,
				},
			],
		};

		expect(reconcileTimeline(input, atSeconds(10 * 60 + 30))).toEqual({
			mutations: [],
			phase: {
				phase: "break",
				nextSubtestId: 2,
				breakEndsAt: atMinutes(11),
				autoSubmittedSubtestId: null,
			},
		});
	});

	test("chain-advances across 45 minutes offline into ongoing subtest 4 with full duration", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: [FOUR_SUBTESTS[3]!, FOUR_SUBTESTS[1]!, FOUR_SUBTESTS[0]!, FOUR_SUBTESTS[2]!],
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const result = reconcileTimeline(input, atMinutes(60));
		expect(result).toEqual({
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(15),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(16),
					deadline: atMinutes(31),
					status: "finished",
					completedAt: atMinutes(31),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 3,
					startedAt: atMinutes(32),
					deadline: atMinutes(47),
					status: "finished",
					completedAt: atMinutes(47),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 4,
					startedAt: atMinutes(48),
					deadline: atMinutes(63),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atMinutes(63),
				},
			],
			phase: {
				phase: "ongoing_subtest",
				subtestId: 4,
				startedAt: atMinutes(48),
				deadline: atMinutes(63),
			},
		});
	});

	test("chain-advances into mid-break before subtest 4 with autoSubmittedSubtestId 3", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const result = reconcileTimeline(input, atSeconds(47 * 60 + 30));
		expect(result).toEqual({
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(15),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(16),
					deadline: atMinutes(31),
					status: "finished",
					completedAt: atMinutes(31),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 3,
					startedAt: atMinutes(32),
					deadline: atMinutes(47),
					status: "finished",
					completedAt: atMinutes(47),
					autoSubmitted: true,
				},
				{
					kind: "set_break",
					breakEndsAt: atMinutes(48),
					overallDeadline: atMinutes(63),
				},
			],
			phase: {
				phase: "break",
				nextSubtestId: 4,
				breakEndsAt: atMinutes(48),
				autoSubmittedSubtestId: 3,
			},
		});
	});

	test("chain-finishes entire attempt across 3 hours offline and clears autoSubmittedSubtestId on reopen", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const result = reconcileTimeline(input, atMinutes(180));
		expect(result).toEqual({
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(15),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(16),
					deadline: atMinutes(31),
					status: "finished",
					completedAt: atMinutes(31),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 3,
					startedAt: atMinutes(32),
					deadline: atMinutes(47),
					status: "finished",
					completedAt: atMinutes(47),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 4,
					startedAt: atMinutes(48),
					deadline: atMinutes(63),
					status: "finished",
					completedAt: atMinutes(63),
					autoSubmitted: true,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atMinutes(63),
				},
				{
					kind: "finish_attempt",
					completedAt: atMinutes(63),
				},
			],
			phase: {
				phase: "finished",
				autoSubmittedSubtestId: 4,
			},
		});

		const reopen = reconcileTimeline({ ...input, attemptStatus: "finished" }, atMinutes(181));
		expect(reopen).toEqual({
			mutations: [],
			phase: { phase: "finished", autoSubmittedSubtestId: null },
		});
	});

	test("handles legacy null breakEndsAt between subtests by starting next subtest at now", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: atMinutes(10),
					status: "finished",
					autoSubmitted: false,
				},
			],
		};

		const result = reconcileTimeline(input, atMinutes(12));
		expect(result).toEqual({
			mutations: [
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(12),
					deadline: atMinutes(27),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atMinutes(59),
				},
			],
			phase: {
				phase: "ongoing_subtest",
				subtestId: 2,
				startedAt: atMinutes(12),
				deadline: atMinutes(27),
			},
		});
	});
});

describe("planSubmitSubtest", () => {
	test("manual submit opens 60s break, shrinks overallDeadline, and retries idempotently during break", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 1, atMinutes(10));
		expect(plan).toEqual({
			kind: "next",
			nextSubtestId: 2,
			breakDeadline: atMinutes(11),
			autoCompletedByTimer: false,
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(10),
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: atMinutes(11),
					overallDeadline: atMinutes(58),
				},
			],
		});

		const retryInput: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(58),
			breakEndsAt: atMinutes(11),
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: atMinutes(10),
					status: "finished",
					autoSubmitted: false,
				},
			],
		};

		expect(planSubmitSubtest(retryInput, 1, atSeconds(10 * 60 + 20))).toEqual({
			kind: "next",
			nextSubtestId: 2,
			breakDeadline: atMinutes(11),
			autoCompletedByTimer: false,
			mutations: [],
		});

		expect(planSubmitSubtest(retryInput, 1, atMinutes(11))).toEqual({
			kind: "next",
			nextSubtestId: 2,
			breakDeadline: null,
			autoCompletedByTimer: false,
			mutations: [],
		});
	});

	test("timeout submit within 60s enters break with autoCompletedByTimer true and retries idempotently", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 1, atSeconds(15 * 60 + 20));
		expect(plan).toEqual({
			kind: "next",
			nextSubtestId: 2,
			breakDeadline: atMinutes(16),
			autoCompletedByTimer: true,
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(15),
					autoSubmitted: true,
				},
				{
					kind: "set_break",
					breakEndsAt: atMinutes(16),
					overallDeadline: atMinutes(63),
				},
			],
		});

		const retry = planSubmitSubtest(
			{
				attemptStatus: "ongoing",
				attemptDeadline: atMinutes(63),
				breakEndsAt: atMinutes(16),
				subtests: FOUR_SUBTESTS,
				subtestAttempts: [
					{
						id: 10,
						subtestId: 1,
						startedAt: BASE,
						deadline: atMinutes(15),
						completedAt: atMinutes(15),
						status: "finished",
						autoSubmitted: true,
					},
				],
			},
			1,
			atSeconds(15 * 60 + 40),
		);
		expect(retry).toEqual({
			kind: "next",
			nextSubtestId: 2,
			breakDeadline: atMinutes(16),
			autoCompletedByTimer: true,
			mutations: [],
		});
	});

	test("late submit after multiple expired breaks chain-advances to active subtest and retries idempotently", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 1, atMinutes(55));
		expect(plan).toEqual({
			kind: "next",
			nextSubtestId: 4,
			breakDeadline: null,
			autoCompletedByTimer: true,
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(15),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(16),
					deadline: atMinutes(31),
					status: "finished",
					completedAt: atMinutes(31),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 3,
					startedAt: atMinutes(32),
					deadline: atMinutes(47),
					status: "finished",
					completedAt: atMinutes(47),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 4,
					startedAt: atMinutes(48),
					deadline: atMinutes(63),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atMinutes(63),
				},
			],
		});

		const retry = planSubmitSubtest(
			{
				attemptStatus: "ongoing",
				attemptDeadline: atMinutes(63),
				breakEndsAt: null,
				subtests: FOUR_SUBTESTS,
				subtestAttempts: [
					{
						id: 10,
						subtestId: 1,
						startedAt: BASE,
						deadline: atMinutes(15),
						completedAt: atMinutes(15),
						status: "finished",
						autoSubmitted: true,
					},
					{
						id: 11,
						subtestId: 2,
						startedAt: atMinutes(16),
						deadline: atMinutes(31),
						completedAt: atMinutes(31),
						status: "finished",
						autoSubmitted: true,
					},
					{
						id: 12,
						subtestId: 3,
						startedAt: atMinutes(32),
						deadline: atMinutes(47),
						completedAt: atMinutes(47),
						status: "finished",
						autoSubmitted: true,
					},
					{
						id: 13,
						subtestId: 4,
						startedAt: atMinutes(48),
						deadline: atMinutes(63),
						completedAt: null,
						status: "ongoing",
						autoSubmitted: false,
					},
				],
			},
			1,
			atMinutes(56),
		);
		expect(retry).toEqual({
			kind: "next",
			nextSubtestId: 4,
			breakDeadline: null,
			autoCompletedByTimer: true,
			mutations: [],
		});
	});

	test("late submit after entire tryout elapsed chain-finishes and retries idempotently", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 1, atMinutes(180));
		expect(plan.kind).toBe("completed");
		if (plan.kind === "completed") {
			expect(plan.autoCompletedByTimer).toBe(true);
			expect(plan.mutations.at(-1)).toEqual({
				kind: "finish_attempt",
				completedAt: atMinutes(63),
			});
		}

		const retry = planSubmitSubtest(
			{
				attemptStatus: "finished",
				attemptDeadline: atMinutes(63),
				breakEndsAt: null,
				subtests: FOUR_SUBTESTS,
				subtestAttempts: [
					{
						id: 10,
						subtestId: 1,
						startedAt: BASE,
						deadline: atMinutes(15),
						completedAt: atMinutes(15),
						status: "finished",
						autoSubmitted: true,
					},
				],
			},
			1,
			atMinutes(181),
		);
		expect(retry).toEqual({
			kind: "completed",
			autoCompletedByTimer: true,
			mutations: [],
		});
	});

	test("final subtest timeout submit succeeds even when now >= attemptDeadline", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 13,
					subtestId: 4,
					startedAt: atMinutes(48),
					deadline: atMinutes(63),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 4, atMinutes(70));
		expect(plan).toEqual({
			kind: "completed",
			autoCompletedByTimer: true,
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 13,
					subtestId: 4,
					completedAt: atMinutes(63),
					autoSubmitted: true,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atMinutes(63),
				},
				{
					kind: "finish_attempt",
					completedAt: atMinutes(63),
				},
			],
		});
	});
});

describe("planStartSubtest", () => {
	test("returns existing attempt with zero mutations when already persisted", () => {
		const existingAttempt = {
			id: 11,
			subtestId: 2,
			startedAt: atMinutes(16),
			deadline: atMinutes(31),
			completedAt: null,
			status: "ongoing" as const,
			autoSubmitted: false,
		};
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [existingAttempt],
		};

		expect(planStartSubtest(input, 2, atMinutes(20))).toEqual({
			kind: "existing",
			subtestAttempt: existingAttempt,
			mutations: [],
		});
	});

	test("allows early skip-break during break and shrinks overallDeadline", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(58),
			breakEndsAt: atMinutes(11),
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: atMinutes(10),
					status: "finished",
					autoSubmitted: false,
				},
			],
		};

		const plan = planStartSubtest(input, 2, atSeconds(10 * 60 + 20));
		expect(plan).toEqual({
			kind: "start",
			subtestId: 2,
			startedAt: atSeconds(10 * 60 + 20),
			deadline: atSeconds(25 * 60 + 20),
			status: "ongoing",
			completedAt: null,
			autoSubmitted: false,
			mutations: [
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atSeconds(10 * 60 + 20),
					deadline: atSeconds(25 * 60 + 20),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atSeconds(57 * 60 + 20),
				},
			],
		});
	});

	test("starts target at breakEndsAt via reconciliation when now >= breakEndsAt", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: atMinutes(16),
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: atMinutes(15),
					status: "finished",
					autoSubmitted: true,
				},
			],
		};

		const plan = planStartSubtest(input, 2, atMinutes(17));
		expect(plan).toEqual({
			kind: "start",
			subtestId: 2,
			startedAt: atMinutes(16),
			deadline: atMinutes(31),
			status: "ongoing",
			completedAt: null,
			autoSubmitted: false,
			mutations: [
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(16),
					deadline: atMinutes(31),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atMinutes(63),
				},
			],
		});
	});

	test("replaces intermediate set_break when skipping break right as previous subtest expires", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planStartSubtest(input, 2, atSeconds(15 * 60 + 20));
		expect(plan).toEqual({
			kind: "start",
			subtestId: 2,
			startedAt: atSeconds(15 * 60 + 20),
			deadline: atSeconds(30 * 60 + 20),
			status: "ongoing",
			completedAt: null,
			autoSubmitted: false,
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 10,
					subtestId: 1,
					completedAt: atMinutes(15),
					autoSubmitted: true,
				},
				{
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atSeconds(15 * 60 + 20),
					deadline: atSeconds(30 * 60 + 20),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
				{
					kind: "set_break",
					breakEndsAt: null,
					overallDeadline: atSeconds(62 * 60 + 20),
				},
			],
		});
	});

	test("rejects out-of-order, unknown, and already-finished attempts", () => {
		const duringSubtest1: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		expect(planStartSubtest(duringSubtest1, 2, atMinutes(5))).toEqual({
			kind: "invalid",
			reason: "prerequisite_not_finished",
		});
		expect(planStartSubtest(duringSubtest1, 999, atMinutes(5))).toEqual({
			kind: "invalid",
			reason: "subtest_not_found",
		});
		expect(planStartSubtest({ ...duringSubtest1, attemptStatus: "finished" }, 2, atMinutes(70))).toEqual({
			kind: "invalid",
			reason: "attempt_finished",
		});
	});
});

describe("planMissingSubtestsForFinalization", () => {
	test("creates finished autoSubmitted entries only for missing subtests", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: FOUR_SUBTESTS,
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: atMinutes(15),
					status: "finished",
					autoSubmitted: true,
				},
			],
		};

		const missing = planMissingSubtestsForFinalization(input, atMinutes(70));
		expect(missing).toEqual([
			{
				kind: "insert_subtest",
				subtestId: 2,
				startedAt: atMinutes(16),
				deadline: atMinutes(31),
				status: "finished",
				completedAt: atMinutes(31),
				autoSubmitted: true,
			},
			{
				kind: "insert_subtest",
				subtestId: 3,
				startedAt: atMinutes(32),
				deadline: atMinutes(47),
				status: "finished",
				completedAt: atMinutes(47),
				autoSubmitted: true,
			},
			{
				kind: "insert_subtest",
				subtestId: 4,
				startedAt: atMinutes(48),
				deadline: atMinutes(63),
				status: "finished",
				completedAt: atMinutes(63),
				autoSubmitted: true,
			},
		]);
	});

	test("returns empty array when all subtests already have rows and handles empty subtestAttempts", () => {
		const allPresent: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: [FOUR_SUBTESTS[0]!],
			subtestAttempts: [
				{
					id: 10,
					subtestId: 1,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		expect(planMissingSubtestsForFinalization(allPresent, atMinutes(20))).toEqual([]);

		const nonePresent: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(63),
			breakEndsAt: null,
			subtests: [FOUR_SUBTESTS[0]!, FOUR_SUBTESTS[1]!],
			subtestAttempts: [],
		};

		expect(planMissingSubtestsForFinalization(nonePresent, atMinutes(20))).toEqual([
			{
				kind: "insert_subtest",
				subtestId: 1,
				startedAt: atMinutes(20),
				deadline: atMinutes(20),
				status: "finished",
				completedAt: atMinutes(20),
				autoSubmitted: true,
			},
			{
				kind: "insert_subtest",
				subtestId: 2,
				startedAt: atMinutes(20),
				deadline: atMinutes(20),
				status: "finished",
				completedAt: atMinutes(20),
				autoSubmitted: true,
			},
		]);
	});
});
