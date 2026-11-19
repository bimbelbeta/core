import { describe, expect, test } from "bun:test";
import { type AttemptTimelineInput, planSubmitSubtest, reconcileSubtestExpiry, type SubtestSchedule } from "./timeline";

const BASE = new Date("2026-01-01T10:00:00.000Z");

function atMinutes(minutes: number) {
	return new Date(BASE.getTime() + minutes * 60_000);
}

function atMs(ms: number) {
	return new Date(BASE.getTime() + ms);
}

const THREE_SUBTESTS: SubtestSchedule[] = [
	{ id: 1, order: 1, durationMinutes: 15 },
	{ id: 2, order: 2, durationMinutes: 20 },
	{ id: 3, order: 3, durationMinutes: 10 },
];

describe("reconcileSubtestExpiry", () => {
	test("returns no mutations when attempt is already finished", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "finished",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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

		const result = reconcileSubtestExpiry(input, atMinutes(50));
		expect(result).toEqual({ mutations: [], autoSubmittedSubtestId: null });
	});

	test("returns no mutations when there is no ongoing subtest attempt", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
			subtestAttempts: [],
		};

		const result = reconcileSubtestExpiry(input, atMinutes(10));
		expect(result).toEqual({ mutations: [], autoSubmittedSubtestId: null });
	});

	test("returns no mutations 1ms before ongoing subtest deadline", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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

		const result = reconcileSubtestExpiry(input, atMs(15 * 60_000 - 1));
		expect(result).toEqual({ mutations: [], autoSubmittedSubtestId: null });
	});

	test("expires at exact 0-second boundary and opens next subtest", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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

		const result = reconcileSubtestExpiry(input, atMinutes(15));
		expect(result.autoSubmittedSubtestId).toBe(1);
		expect(result.mutations).toEqual([
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
				startedAt: atMinutes(15),
				deadline: atMinutes(35),
				status: "ongoing",
				completedAt: null,
				autoSubmitted: false,
			},
		]);
	});

	test("opens next subtest when expired 5 minutes ago and attempt deadline has not elapsed", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: [THREE_SUBTESTS[2]!, THREE_SUBTESTS[0]!, THREE_SUBTESTS[1]!],
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

		const result = reconcileSubtestExpiry(input, atMinutes(20));
		expect(result.autoSubmittedSubtestId).toBe(1);
		expect(result.mutations).toEqual([
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
				startedAt: atMinutes(15),
				deadline: atMinutes(35),
				status: "ongoing",
				completedAt: null,
				autoSubmitted: false,
			},
		]);
	});

	test("caps next subtest deadline at attemptDeadline", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(25),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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

		const result = reconcileSubtestExpiry(input, atMinutes(18));
		expect(result.mutations[1]).toEqual({
			kind: "insert_subtest",
			subtestId: 2,
			startedAt: atMinutes(15),
			deadline: atMinutes(25),
			status: "ongoing",
			completedAt: null,
			autoSubmitted: false,
		});
	});

	test("finalizes attempt when now reaches attemptDeadline on non-final subtest", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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

		const result = reconcileSubtestExpiry(input, atMinutes(50));
		expect(result.autoSubmittedSubtestId).toBe(1);
		expect(result.mutations).toEqual([
			{
				kind: "finish_subtest",
				subtestAttemptId: 10,
				subtestId: 1,
				completedAt: atMinutes(15),
				autoSubmitted: true,
			},
			{
				kind: "finish_attempt",
				completedAt: atMinutes(45),
			},
		]);
	});

	test("finishes final subtest and attempt even when now >= attemptDeadline", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
			subtestAttempts: [
				{
					id: 12,
					subtestId: 3,
					startedAt: atMinutes(35),
					deadline: atMinutes(45),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const result = reconcileSubtestExpiry(input, atMinutes(52));
		expect(result.autoSubmittedSubtestId).toBe(3);
		expect(result.mutations).toEqual([
			{
				kind: "finish_subtest",
				subtestAttemptId: 12,
				subtestId: 3,
				completedAt: atMinutes(45),
				autoSubmitted: true,
			},
			{
				kind: "finish_attempt",
				completedAt: atMinutes(45),
			},
		]);
	});
});

describe("planSubmitSubtest", () => {
	test("manual submit on non-final subtest finishes current and opens next at now", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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
			breakDeadline: null,
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
					kind: "insert_subtest",
					subtestId: 2,
					startedAt: atMinutes(10),
					deadline: atMinutes(30),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
			],
		});
	});

	test("manual submit on final subtest finishes subtest and attempt", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
			subtestAttempts: [
				{
					id: 12,
					subtestId: 3,
					startedAt: atMinutes(35),
					deadline: atMinutes(45),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 3, atMinutes(40));
		expect(plan).toEqual({
			kind: "completed",
			autoCompletedByTimer: false,
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 12,
					subtestId: 3,
					completedAt: atMinutes(40),
					autoSubmitted: false,
				},
				{
					kind: "finish_attempt",
					completedAt: atMinutes(40),
				},
			],
		});
	});

	test("timeout submit at exact deadline marks autoSubmitted true and opens next", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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

		const plan = planSubmitSubtest(input, 1, atMinutes(15));
		expect(plan).toEqual({
			kind: "next",
			nextSubtestId: 2,
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
					startedAt: atMinutes(15),
					deadline: atMinutes(35),
					status: "ongoing",
					completedAt: null,
					autoSubmitted: false,
				},
			],
		});
	});

	test("timeout submit on final subtest succeeds even when now >= attemptDeadline", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
			subtestAttempts: [
				{
					id: 12,
					subtestId: 3,
					startedAt: atMinutes(35),
					deadline: atMinutes(45),
					completedAt: null,
					status: "ongoing",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 3, atMinutes(47));
		expect(plan).toEqual({
			kind: "completed",
			autoCompletedByTimer: true,
			mutations: [
				{
					kind: "finish_subtest",
					subtestAttemptId: 12,
					subtestId: 3,
					completedAt: atMinutes(45),
					autoSubmitted: true,
				},
				{
					kind: "finish_attempt",
					completedAt: atMinutes(45),
				},
			],
		});
	});

	test("idempotent retry on finished non-final subtest returns zero mutations and stored autoSubmitted", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
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

		const plan = planSubmitSubtest(input, 1, atMinutes(16));
		expect(plan).toEqual({
			kind: "next",
			nextSubtestId: 2,
			breakDeadline: null,
			autoCompletedByTimer: true,
			mutations: [],
		});
	});

	test("idempotent retry on finished final subtest returns completed with zero mutations", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "finished",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
			subtestAttempts: [
				{
					id: 12,
					subtestId: 3,
					startedAt: atMinutes(35),
					deadline: atMinutes(45),
					completedAt: atMinutes(41),
					status: "finished",
					autoSubmitted: false,
				},
			],
		};

		const plan = planSubmitSubtest(input, 3, atMinutes(46));
		expect(plan).toEqual({
			kind: "completed",
			autoCompletedByTimer: false,
			mutations: [],
		});
	});

	test("returns invalid when target subtest is missing or not ongoing/finished", () => {
		const input: AttemptTimelineInput = {
			attemptStatus: "ongoing",
			attemptDeadline: atMinutes(45),
			breakEndsAt: null,
			subtests: THREE_SUBTESTS,
			subtestAttempts: [
				{
					id: 11,
					subtestId: 2,
					startedAt: BASE,
					deadline: atMinutes(15),
					completedAt: null,
					status: "not_started",
					autoSubmitted: false,
				},
			],
		};

		expect(planSubmitSubtest(input, 1, atMinutes(5))).toEqual({ kind: "invalid" });
		expect(planSubmitSubtest(input, 2, atMinutes(5))).toEqual({ kind: "invalid" });
	});
});
