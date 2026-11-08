import { describe, expect, test } from "bun:test";
import { DomainError } from "@/lib/domain-error";
import { createActiveSubtestService } from "./active-subtest.service";
import type { ActiveSessionAttempt, AnswerFields } from "./repository";

type RecordedAnswer = { attemptId: number; questionId: number; fields: AnswerFields };

function makeRepository(rows: {
	attempt?: ActiveSessionAttempt | undefined;
	answers: RecordedAnswer[];
	toggles: Array<{ attemptId: number; questionId: number }>;
}) {
	return {
		findOngoingAttemptForSession: async () => rows.attempt,
		upsertAnswer: async (attemptId: number, questionId: number, fields: AnswerFields) => {
			rows.answers.push({ attemptId, questionId, fields });
		},
		toggleAnswerDoubtful: async (attemptId: number, questionId: number) => {
			rows.toggles.push({ attemptId, questionId });
		},
	};
}

function sessionWith(subtestAttempts: Array<{ status: "ongoing" | "finished"; deadline: Date }>) {
	return { id: 42, subtestAttempts };
}

describe("active subtest service", () => {
	test("returns the user's active attempt", async () => {
		const repository = makeRepository({
			attempt: sessionWith([{ status: "ongoing", deadline: new Date("2100-01-01") }]),
			answers: [],
			toggles: [],
		});
		const service = createActiveSubtestService({ repository });
		expect(await service.require(1, "user-1")).toBe(42);
	});

	test("rejects missing attempts and missing active subtests", async () => {
		const missing = createActiveSubtestService({ repository: makeRepository({ answers: [], toggles: [] }) });
		const finished = createActiveSubtestService({
			repository: makeRepository({
				attempt: sessionWith([{ status: "finished", deadline: new Date(0) }]),
				answers: [],
				toggles: [],
			}),
		});
		await expect(missing.require(1, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tidak ada pengerjaan yang aktif",
		});
		await expect(finished.require(1, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tidak ada subtest yang aktif",
		});
	});

	test("rejects an expired subtest and permits a future deadline", async () => {
		const expired = createActiveSubtestService({
			repository: makeRepository({
				attempt: sessionWith([{ status: "ongoing", deadline: new Date(0) }]),
				answers: [],
				toggles: [],
			}),
		});
		const future = createActiveSubtestService({
			repository: makeRepository({
				attempt: sessionWith([{ status: "ongoing", deadline: new Date("2100-01-01") }]),
				answers: [],
				toggles: [],
			}),
		});
		await expect(expired.require(1, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Batas waktu subtest telah habis",
		});
		expect(await future.require(1, "user-1")).toBe(42);
	});

	test("reports expected failures as DomainError", async () => {
		const service = createActiveSubtestService({ repository: makeRepository({ answers: [], toggles: [] }) });
		await expect(service.require(1, "user-1")).rejects.toBeInstanceOf(DomainError);
	});

	test("saves the answer field matching the answer type against the active attempt", async () => {
		const answers: RecordedAnswer[] = [];
		const repository = makeRepository({
			attempt: sessionWith([{ status: "ongoing", deadline: new Date("2100-01-01") }]),
			answers,
			toggles: [],
		});
		const service = createActiveSubtestService({ repository });

		await expect(
			service.saveAnswer({ tryoutId: 1, questionId: 5, answerType: "choice", selectedChoiceId: 3 }, "user-1"),
		).resolves.toEqual({ success: true });
		await expect(
			service.saveAnswer({ tryoutId: 1, questionId: 6, answerType: "complex", selectedChoiceIds: [1, 2] }, "user-1"),
		).resolves.toEqual({ success: true });
		await expect(
			service.saveAnswer({ tryoutId: 1, questionId: 7, answerType: "essay", essayAnswer: "Jawaban" }, "user-1"),
		).resolves.toEqual({ success: true });

		expect(answers).toEqual([
			{
				attemptId: 42,
				questionId: 5,
				fields: { selectedChoiceId: 3, selectedChoiceIds: null, essayAnswer: null },
			},
			{
				attemptId: 42,
				questionId: 6,
				fields: { selectedChoiceId: null, selectedChoiceIds: [1, 2], essayAnswer: null },
			},
			{
				attemptId: 42,
				questionId: 7,
				fields: { selectedChoiceId: null, selectedChoiceIds: null, essayAnswer: "Jawaban" },
			},
		]);
	});

	test("does not write an answer when the session is rejected", async () => {
		const answers: RecordedAnswer[] = [];
		const service = createActiveSubtestService({ repository: makeRepository({ answers, toggles: [] }) });
		await expect(
			service.saveAnswer({ tryoutId: 1, questionId: 5, answerType: "choice", selectedChoiceId: 3 }, "user-1"),
		).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Tidak ada pengerjaan yang aktif" });
		expect(answers).toEqual([]);
	});

	test("toggles the ragu-ragu flag on the active attempt", async () => {
		const toggles: Array<{ attemptId: number; questionId: number }> = [];
		const repository = makeRepository({
			attempt: sessionWith([{ status: "ongoing", deadline: new Date("2100-01-01") }]),
			answers: [],
			toggles,
		});
		const service = createActiveSubtestService({ repository });

		await expect(service.toggleRaguRagu({ tryoutId: 1, questionId: 5 }, "user-1")).resolves.toEqual({ success: true });
		expect(toggles).toEqual([{ attemptId: 42, questionId: 5 }]);
	});

	test("does not toggle when the session is rejected", async () => {
		const toggles: Array<{ attemptId: number; questionId: number }> = [];
		const service = createActiveSubtestService({ repository: makeRepository({ answers: [], toggles }) });
		await expect(service.toggleRaguRagu({ tryoutId: 1, questionId: 5 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tidak ada pengerjaan yang aktif",
		});
		expect(toggles).toEqual([]);
	});
});
