import { describe, expect, test } from "bun:test";
import { DomainError } from "@/lib/domain-error";
import type { SubtestAttemptRow, SubtestStartAttempt } from "./repository";
import { createStartSubtestService } from "./start-subtest.service";

const deadline = new Date("2100-01-01T00:00:00Z");
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
const subtestAttempt = {
	id: 5,
	tryoutAttemptId: 2,
	subtestId: 10,
	startedAt: new Date(),
	completedAt: null,
	deadline,
	status: "finished" as const,
	score: "75",
};
const attempt: SubtestStartAttempt = {
	id: 2,
	deadline,
	subtestAttempts: [subtestAttempt satisfies SubtestAttemptRow],
	tryout: { id: 1, subtests: [subtest, { ...subtest, id: 11, order: 2 }] },
};

function makeRepository(overrides: {
	attempts?: Array<SubtestStartAttempt | undefined>;
	attempt?: SubtestStartAttempt | undefined;
	inserted: SubtestAttemptInsertRecorder[];
}) {
	const pending = overrides.attempts ? [...overrides.attempts] : [];
	return {
		findAttemptForSubtestStart: async () => (pending.length > 0 ? pending.shift() : overrides.attempt),
		insertSubtestAttempt: async (values: SubtestAttemptInsertRecorder) => {
			overrides.inserted.push(values);
			return { ...subtestAttempt, ...values, id: 6 };
		},
	};
}

type SubtestAttemptInsertRecorder = {
	tryoutAttemptId: number;
	subtestId: number;
	deadline: Date;
};

describe("start subtest service", () => {
	test("returns an existing attempt without creating another", async () => {
		const inserted: SubtestAttemptInsertRecorder[] = [];
		const service = createStartSubtestService({
			repository: makeRepository({ attempt, inserted }),
		});
		expect(await service.start(1, 10, "user")).toEqual({ ...subtestAttempt, score: 75 });
		expect(inserted).toHaveLength(0);
	});

	test("starts the next subtest from the prior deadline", async () => {
		const inserted: SubtestAttemptInsertRecorder[] = [];
		const overall = new Date(Date.now() + 120 * 60 * 1000);
		const previousDeadline = new Date(Date.now() + 5 * 60 * 1000);
		const service = createStartSubtestService({
			repository: makeRepository({
				attempt: {
					...attempt,
					deadline: overall,
					subtestAttempts: [{ ...subtestAttempt, deadline: previousDeadline }],
				},
				inserted,
			}),
		});

		await service.start(1, 11, "user");

		expect(inserted).toEqual([
			{
				tryoutAttemptId: 2,
				subtestId: 11,
				deadline: new Date(previousDeadline.getTime() + 30 * 60 * 1000),
			},
		]);
	});

	test("caps the next deadline at the overall tryout deadline", async () => {
		const inserted: SubtestAttemptInsertRecorder[] = [];
		const overall = new Date(Date.now() + 50 * 60 * 1000);
		const previousDeadline = new Date(Date.now() + 40 * 60 * 1000);
		const service = createStartSubtestService({
			repository: makeRepository({
				attempt: {
					...attempt,
					deadline: overall,
					subtestAttempts: [{ ...subtestAttempt, deadline: previousDeadline }],
				},
				inserted,
			}),
		});

		await service.start(1, 11, "user");

		expect(inserted).toEqual([{ tryoutAttemptId: 2, subtestId: 11, deadline: overall }]);
		expect(overall.getTime()).toBeLessThan(previousDeadline.getTime() + 30 * 60 * 1000);
	});

	test("rejects missing attempts and unknown subtests", async () => {
		const inserted: SubtestAttemptInsertRecorder[] = [];
		const service = createStartSubtestService({
			repository: makeRepository({ attempts: [undefined, attempt], inserted }),
		});
		await expect(service.start(1, 10, "user")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Anda belum memulai tryout ini",
		});
		await expect(service.start(1, 99, "user")).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});
	});

	test("rejects starting a subtest before its predecessor is finished", async () => {
		const inserted: SubtestAttemptInsertRecorder[] = [];
		const service = createStartSubtestService({
			repository: makeRepository({
				attempt: { ...attempt, subtestAttempts: [] },
				inserted,
			}),
		});
		await expect(service.start(1, 11, "user")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Selesaikan subtest sebelumnya terlebih dahulu",
		});
	});

	test("rejects a missing tryout with NOT_FOUND", async () => {
		const inserted: SubtestAttemptInsertRecorder[] = [];
		const service = createStartSubtestService({
			repository: makeRepository({
				attempt: { ...attempt, tryout: null, subtestAttempts: [] },
				inserted,
			}),
		});
		await expect(service.start(1, 10, "user")).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
		await expect(service.start(1, 11, "user")).rejects.toBeInstanceOf(DomainError);
	});

	test("normalizes the created attempt score to a number", async () => {
		const inserted: SubtestAttemptInsertRecorder[] = [];
		const service = createStartSubtestService({
			repository: makeRepository({
				attempt: {
					...attempt,
					deadline: new Date(Date.now() + 120 * 60 * 1000),
					subtestAttempts: [{ ...subtestAttempt, deadline: new Date(Date.now() - 1000) }],
				},
				inserted,
			}),
		});
		const created = await service.start(1, 11, "user");
		expect(created.score).toBe(75);
	});
});
