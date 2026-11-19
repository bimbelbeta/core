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
	if (remaining.length === 0) {
		mutations.push(...finalizeAttemptMutations(effectiveEnd, true));
		return { kind: "completed", autoCompletedByTimer: isTimeout, mutations };
	}
	const breakStart = new Date(effectiveEnd.getTime() + INTER_SUBTEST_BREAK_MS);
	const autoId = isTimeout ? targetSubtestId : null;
	const advanced = advanceFromBreak(input, now, remaining, breakStart, autoId, mutations);
	if (advanced.phase.phase === "finished") {
		return { kind: "completed", autoCompletedByTimer: isTimeout, mutations: advanced.mutations };
	}
	return {
		kind: "next",
		nextSubtestId: advanced.phase.phase === "break" ? advanced.phase.nextSubtestId : advanced.phase.subtestId,
		breakDeadline: advanced.phase.phase === "break" ? advanced.phase.breakEndsAt : null,
		autoCompletedByTimer: isTimeout,
		mutations: advanced.mutations,
	};
}

export const INTER_SUBTEST_BREAK_MS = 60_000;

function startPlan(m: InsertSubtestMutation, mutations: TimelineMutation[]): StartSubtestPlan {
	return { ...m, kind: "start", mutations };
}

function advanceFromBreak(
	input: AttemptTimelineInput,
	now: Date,
	remainingSubtests: SubtestSchedule[],
	initialBreakEndsAt: Date,
	initialAutoSubmittedId: number | null,
	priorMutations: TimelineMutation[] = [],
): TimelineReconciliation {
	const mutations = [...priorMutations];
	let breakEndsAt = initialBreakEndsAt;
	let autoSubmittedId = initialAutoSubmittedId;

	for (let index = 0; index < remainingSubtests.length; index++) {
		const subtest = remainingSubtests[index]!;
		const remaining = remainingSubtests.slice(index);
		if (now.getTime() < breakEndsAt.getTime()) {
			const overallDeadline = computeOverallDeadline(breakEndsAt, remaining);
			const shouldEmit =
				mutations.length > 0 ||
				input.breakEndsAt?.getTime() !== breakEndsAt.getTime() ||
				input.attemptDeadline.getTime() !== overallDeadline.getTime();
			if (shouldEmit) mutations.push(setBreakMutation(breakEndsAt, overallDeadline));
			return {
				mutations,
				phase: { phase: "break", nextSubtestId: subtest.id, breakEndsAt, autoSubmittedSubtestId: autoSubmittedId },
			};
		}

		const cursor = breakEndsAt;
		const subtestDeadline = new Date(cursor.getTime() + subtest.durationMinutes * MS_PER_MINUTE);
		if (now.getTime() < subtestDeadline.getTime()) {
			mutations.push(
				openSubtestMutation(subtest.id, cursor, subtestDeadline),
				setBreakMutation(null, computeOverallDeadline(cursor, remaining)),
			);
			return {
				mutations,
				phase: { phase: "ongoing_subtest", subtestId: subtest.id, startedAt: cursor, deadline: subtestDeadline },
			};
		}

		mutations.push(closedSubtestMutation(subtest.id, cursor, subtestDeadline, subtestDeadline));
		autoSubmittedId = subtest.id;
		if (index === remainingSubtests.length - 1) {
			mutations.push(...finalizeAttemptMutations(subtestDeadline, true));
			return { mutations, phase: { phase: "finished", autoSubmittedSubtestId: subtest.id } };
		}
		breakEndsAt = new Date(subtestDeadline.getTime() + INTER_SUBTEST_BREAK_MS);
	}

	return { mutations, phase: { phase: "finished", autoSubmittedSubtestId: autoSubmittedId } };
}

export function reconcileTimeline(input: AttemptTimelineInput, now: Date): TimelineReconciliation {
	if (input.attemptStatus === "finished") {
		return { mutations: [], phase: { phase: "finished", autoSubmittedSubtestId: null } };
	}

	const { orderedSubtests, attemptBySubtestId } = prepareContext(input);
	if (orderedSubtests.length === 0) {
		return {
			mutations: finalizeAttemptMutations(now, true),
			phase: { phase: "finished", autoSubmittedSubtestId: null },
		};
	}

	const ongoing = input.subtestAttempts.find((sa) => sa.status === "ongoing");
	if (ongoing) {
		if (now.getTime() < ongoing.deadline.getTime()) {
			return {
				mutations: [],
				phase: {
					phase: "ongoing_subtest",
					subtestId: ongoing.subtestId,
					startedAt: ongoing.startedAt,
					deadline: ongoing.deadline,
				},
			};
		}
		const mutations = [finishSubtestMutation(ongoing, ongoing.deadline, true)];
		const ongoingIndex = orderedSubtests.findIndex((s) => s.id === ongoing.subtestId);
		const remaining =
			ongoingIndex === -1 ? [] : remainingUnfinished(orderedSubtests, attemptBySubtestId, ongoingIndex + 1);
		if (remaining.length === 0) {
			mutations.push(...finalizeAttemptMutations(ongoing.deadline, true));
			return { mutations, phase: { phase: "finished", autoSubmittedSubtestId: ongoing.subtestId } };
		}
		const breakStart = new Date(ongoing.deadline.getTime() + INTER_SUBTEST_BREAK_MS);
		return advanceFromBreak(input, now, remaining, breakStart, ongoing.subtestId, mutations);
	}

	const nextIndex = orderedSubtests.findIndex((s) => attemptBySubtestId.get(s.id)?.status !== "finished");
	if (nextIndex === -1) {
		const lastAttempt = attemptBySubtestId.get(orderedSubtests[orderedSubtests.length - 1]!.id);
		const completedAt = lastAttempt?.completedAt ?? lastAttempt?.deadline ?? now;
		return {
			mutations: finalizeAttemptMutations(completedAt, true),
			phase: { phase: "finished", autoSubmittedSubtestId: lastAttempt?.autoSubmitted ? lastAttempt.subtestId : null },
		};
	}

	let autoSubmittedId: number | null = null;
	for (let index = nextIndex - 1; index >= 0; index--) {
		const previous = attemptBySubtestId.get(orderedSubtests[index]!.id);
		if (previous?.status === "finished") {
			autoSubmittedId = previous.autoSubmitted ? previous.subtestId : null;
			break;
		}
	}

	const remaining = remainingUnfinished(orderedSubtests, attemptBySubtestId, nextIndex);
	return advanceFromBreak(input, now, remaining, input.breakEndsAt ?? now, autoSubmittedId);
}

export function planStartSubtest(input: AttemptTimelineInput, targetSubtestId: number, now: Date): StartSubtestPlan {
	const { orderedSubtests, attemptBySubtestId } = prepareContext(input);
	const targetIndex = orderedSubtests.findIndex((s) => s.id === targetSubtestId);
	if (targetIndex === -1) return { kind: "invalid", reason: "subtest_not_found" };

	const existing = attemptBySubtestId.get(targetSubtestId);
	if (existing) return { kind: "existing", subtestAttempt: existing, mutations: [] };

	const reconciled = reconcileTimeline(input, now);
	for (const mutation of reconciled.mutations) {
		if (mutation.kind === "insert_subtest" && mutation.subtestId === targetSubtestId) {
			return startPlan(mutation, reconciled.mutations);
		}
	}

	if (reconciled.phase.phase === "break" && reconciled.phase.nextSubtestId === targetSubtestId) {
		const target = orderedSubtests[targetIndex]!;
		const breakEndsAt = reconciled.phase.breakEndsAt;
		const startFrom = now.getTime() < breakEndsAt.getTime() ? now : breakEndsAt;
		const subtestDeadline = new Date(startFrom.getTime() + target.durationMinutes * MS_PER_MINUTE);
		const openMutation = openSubtestMutation(target.id, startFrom, subtestDeadline);
		const remaining = remainingUnfinished(orderedSubtests, attemptBySubtestId, targetIndex);
		const mutations = [
			...reconciled.mutations.filter((m) => m.kind !== "set_break"),
			openMutation,
			setBreakMutation(null, computeOverallDeadline(startFrom, remaining)),
		];
		return startPlan(openMutation, mutations);
	}

	return {
		kind: "invalid",
		reason: reconciled.phase.phase === "finished" ? "attempt_finished" : "prerequisite_not_finished",
	};
}

export function planMissingSubtestsForFinalization(input: AttemptTimelineInput, now: Date) {
	const { orderedSubtests, attemptBySubtestId } = prepareContext(input);
	const mutations: InsertSubtestMutation[] = [];
	let cursorMs: number | null = null;
	const nowMs = now.getTime();

	for (const subtest of orderedSubtests) {
		const existing = attemptBySubtestId.get(subtest.id);
		if (existing) {
			cursorMs = (existing.completedAt ?? existing.deadline).getTime() + INTER_SUBTEST_BREAK_MS;
			continue;
		}
		const startedAtMs = cursorMs !== null ? Math.min(cursorMs, nowMs) : nowMs;
		const completedAtMs = Math.min(startedAtMs + subtest.durationMinutes * MS_PER_MINUTE, nowMs);
		const completedAt = new Date(completedAtMs);
		mutations.push(closedSubtestMutation(subtest.id, new Date(startedAtMs), completedAt, completedAt));
		cursorMs = completedAtMs + INTER_SUBTEST_BREAK_MS;
	}

	return mutations;
}
