export type SubtestSchedule = { id: number; order: number; durationMinutes: number };

export type PersistedSubtestAttempt = {
	id: number;
	subtestId: number;
	startedAt: Date;
	deadline: Date;
	completedAt: Date | null;
	status: "not_started" | "ongoing" | "finished";
	autoSubmitted: boolean;
};

export type AttemptTimelineInput = {
	attemptStatus: "not_started" | "ongoing" | "finished";
	attemptDeadline: Date;
	breakEndsAt: Date | null;
	subtests: SubtestSchedule[];
	subtestAttempts: PersistedSubtestAttempt[];
};

export type TimelineMutation =
	| { kind: "finish_subtest"; subtestAttemptId: number; subtestId: number; completedAt: Date; autoSubmitted: boolean }
	| {
			kind: "insert_subtest";
			subtestId: number;
			startedAt: Date;
			deadline: Date;
			status: "ongoing" | "finished";
			completedAt: Date | null;
			autoSubmitted: boolean;
	  }
	| { kind: "set_break"; breakEndsAt: Date | null; overallDeadline: Date }
	| { kind: "finish_attempt"; completedAt: Date };

export type TimelinePhase =
	| { phase: "ongoing_subtest"; subtestId: number; startedAt: Date; deadline: Date }
	| { phase: "break"; nextSubtestId: number; breakEndsAt: Date; autoSubmittedSubtestId: number | null }
	| { phase: "finished"; autoSubmittedSubtestId: number | null };

export type TimelineReconciliation = { mutations: TimelineMutation[]; phase: TimelinePhase };

export type SubmitSubtestPlan =
	| {
			kind: "next";
			nextSubtestId: number;
			breakDeadline: Date | null;
			autoCompletedByTimer: boolean;
			mutations: TimelineMutation[];
	  }
	| { kind: "completed"; autoCompletedByTimer: boolean; mutations: TimelineMutation[] }
	| { kind: "invalid" };

export type StartSubtestPlan =
	| { kind: "existing"; subtestAttempt: PersistedSubtestAttempt; mutations: TimelineMutation[] }
	| {
			kind: "start";
			subtestId: number;
			startedAt: Date;
			deadline: Date;
			status: "ongoing" | "finished";
			completedAt: Date | null;
			autoSubmitted: boolean;
			mutations: TimelineMutation[];
	  }
	| { kind: "invalid"; reason: "subtest_not_found" | "attempt_finished" | "prerequisite_not_finished" };

const MS_PER_MINUTE = 60_000;

export type InsertSubtestMutation = Extract<TimelineMutation, { kind: "insert_subtest" }>;

function prepareContext(input: AttemptTimelineInput) {
	const orderedSubtests = [...input.subtests].sort((a, b) => a.order - b.order || a.id - b.id);
	const attemptBySubtestId = new Map(input.subtestAttempts.map((sa) => [sa.subtestId, sa]));
	return { orderedSubtests, attemptBySubtestId };
}

function remainingUnfinished(
	orderedSubtests: SubtestSchedule[],
	attemptBySubtestId: Map<number, PersistedSubtestAttempt>,
	fromIndex: number,
) {
	return orderedSubtests.slice(fromIndex).filter((s) => attemptBySubtestId.get(s.id)?.status !== "finished");
}

function finishSubtestMutation(
	sa: PersistedSubtestAttempt,
	completedAt: Date,
	autoSubmitted: boolean,
): TimelineMutation {
	return { kind: "finish_subtest", subtestAttemptId: sa.id, subtestId: sa.subtestId, completedAt, autoSubmitted };
}

function openSubtestMutation(subtestId: number, startedAt: Date, deadline: Date): InsertSubtestMutation {
	return {
		kind: "insert_subtest",
		subtestId,
		startedAt,
		deadline,
		status: "ongoing",
		completedAt: null,
		autoSubmitted: false,
	};
}

export function closedSubtestMutation(
	subtestId: number,
	startedAt: Date,
	deadline: Date,
	completedAt: Date,
): InsertSubtestMutation {
	return {
		kind: "insert_subtest",
		subtestId,
		startedAt,
		deadline,
		status: "finished",
		completedAt,
		autoSubmitted: true,
	};
}

export function setBreakMutation(breakEndsAt: Date | null, overallDeadline: Date): TimelineMutation {
	return { kind: "set_break", breakEndsAt, overallDeadline };
}

function finalizeAttemptMutations(completedAt: Date, clearBreak = false): TimelineMutation[] {
	return clearBreak
		? [setBreakMutation(null, completedAt), { kind: "finish_attempt", completedAt }]
		: [{ kind: "finish_attempt", completedAt }];
}

export function computeOverallDeadline(from: Date, remainingSubtests: SubtestSchedule[]): Date {
	const durationMs = remainingSubtests.reduce((sum, subtest) => sum + subtest.durationMinutes * MS_PER_MINUTE, 0);
	const breakMs = Math.max(0, remainingSubtests.length - 1) * MS_PER_MINUTE;
	return new Date(from.getTime() + durationMs + breakMs);
}

function openOrFinalizeWithoutBreak(
	mutations: TimelineMutation[],
	nextSubtest: SubtestSchedule | undefined,
	effectiveEnd: Date,
	attemptDeadline: Date,
	now: Date,
) {
	if (!nextSubtest) {
		mutations.push(...finalizeAttemptMutations(effectiveEnd));
		return null;
	}
	if (now.getTime() >= attemptDeadline.getTime()) {
		const completedAt = effectiveEnd.getTime() > attemptDeadline.getTime() ? effectiveEnd : attemptDeadline;
		mutations.push(...finalizeAttemptMutations(completedAt));
		return null;
	}
	const nextDeadline = new Date(
		Math.min(effectiveEnd.getTime() + nextSubtest.durationMinutes * MS_PER_MINUTE, attemptDeadline.getTime()),
	);
	mutations.push(openSubtestMutation(nextSubtest.id, effectiveEnd, nextDeadline));
	return nextSubtest.id;
}

export function reconcileSubtestExpiry(
	input: AttemptTimelineInput,
	now: Date,
): { mutations: TimelineMutation[]; autoSubmittedSubtestId: number | null } {
	if (input.attemptStatus === "finished") return { mutations: [], autoSubmittedSubtestId: null };

	const { orderedSubtests } = prepareContext(input);
	const ongoing = input.subtestAttempts.find((sa) => sa.status === "ongoing");
	if (!ongoing || now.getTime() < ongoing.deadline.getTime()) {
		return { mutations: [], autoSubmittedSubtestId: null };
	}

	const mutations = [finishSubtestMutation(ongoing, ongoing.deadline, true)];
	const currentIndex = orderedSubtests.findIndex((s) => s.id === ongoing.subtestId);
	const nextSubtest = currentIndex === -1 ? undefined : orderedSubtests[currentIndex + 1];
	openOrFinalizeWithoutBreak(mutations, nextSubtest, ongoing.deadline, input.attemptDeadline, now);
	return { mutations, autoSubmittedSubtestId: ongoing.subtestId };
}

export function planSubmitSubtest(input: AttemptTimelineInput, targetSubtestId: number, now: Date): SubmitSubtestPlan {
	const { orderedSubtests, attemptBySubtestId } = prepareContext(input);
	const existing = attemptBySubtestId.get(targetSubtestId);
	const currentIndex = orderedSubtests.findIndex((s) => s.id === targetSubtestId);
	if (!existing || currentIndex === -1) return { kind: "invalid" };

	const remaining = remainingUnfinished(orderedSubtests, attemptBySubtestId, currentIndex + 1);
	if (existing.status === "finished") {
		if (input.attemptStatus === "finished" || remaining.length === 0) {
			return { kind: "completed", autoCompletedByTimer: existing.autoSubmitted, mutations: [] };
		}
		const nextUnfinished = remaining[0]!;
		const nextAttempt = attemptBySubtestId.get(nextUnfinished.id);
		const inBreak =
			nextAttempt?.status !== "ongoing" && input.breakEndsAt !== null && now.getTime() < input.breakEndsAt.getTime();
		return {
			kind: "next",
			nextSubtestId: nextUnfinished.id,
			breakDeadline: inBreak ? input.breakEndsAt : null,
			autoCompletedByTimer: existing.autoSubmitted,
			mutations: [],
		};
	}

	if (existing.status !== "ongoing" || input.attemptStatus === "finished") return { kind: "invalid" };

	const isTimeout = now.getTime() >= existing.deadline.getTime();
	const effectiveEnd = isTimeout ? existing.deadline : now;
	const mutations = [finishSubtestMutation(existing, effectiveEnd, isTimeout)];
	const nextId = openOrFinalizeWithoutBreak(mutations, remaining[0], effectiveEnd, input.attemptDeadline, now);
	return nextId === null
		? { kind: "completed", autoCompletedByTimer: isTimeout, mutations }
		: { kind: "next", nextSubtestId: nextId, breakDeadline: null, autoCompletedByTimer: isTimeout, mutations };
}
