import { describe, expect, mock, test } from "bun:test";
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
const attempt = {
	id: 2,
	deadline,
	subtestAttempts: [subtestAttempt],
	tryout: { id: 1, subtests: [subtest, { ...subtest, id: 11, order: 2 }] },
};

function setup() {
	const deps = {
		findAttempt: mock(async (): Promise<typeof attempt | undefined> => attempt),
		createSubtestAttempt: mock(async () => ({ ...subtestAttempt, id: 6, subtestId: 11 })),
	};
	return { deps, service: createStartSubtestService(deps) };
}

describe("start subtest service", () => {
	test("returns an existing attempt without creating another", async () => {
		const { deps, service } = setup();
		expect(await service.start(1, 10, "user")).toEqual({ ...subtestAttempt, score: 75 });
		expect(deps.createSubtestAttempt).not.toHaveBeenCalled();
	});

	test("starts the next subtest from the prior deadline", async () => {
		const { deps, service } = setup();
		const overall = new Date(Date.now() + 120 * 60 * 1000);
		const previousDeadline = new Date(Date.now() + 5 * 60 * 1000);
		deps.findAttempt.mockResolvedValueOnce({
			...attempt,
			deadline: overall,
			subtestAttempts: [{ ...subtestAttempt, deadline: previousDeadline }],
		});

		await service.start(1, 11, "user");

		expect(deps.createSubtestAttempt).toHaveBeenCalledWith({
			tryoutAttemptId: 2,
			subtestId: 11,
			deadline: new Date(previousDeadline.getTime() + 30 * 60 * 1000),
		});
	});

	test("caps the next deadline at the overall tryout deadline", async () => {
		const { deps, service } = setup();
		const overall = new Date(Date.now() + 50 * 60 * 1000);
		const previousDeadline = new Date(Date.now() + 40 * 60 * 1000);
		deps.findAttempt.mockResolvedValueOnce({
			...attempt,
			deadline: overall,
			subtestAttempts: [{ ...subtestAttempt, deadline: previousDeadline }],
		});

		await service.start(1, 11, "user");

		expect(deps.createSubtestAttempt).toHaveBeenCalledWith({ tryoutAttemptId: 2, subtestId: 11, deadline: overall });
		expect(overall.getTime()).toBeLessThan(previousDeadline.getTime() + 30 * 60 * 1000);
	});

	test("rejects missing attempts and unknown subtests", async () => {
		const { deps, service } = setup();
		deps.findAttempt.mockResolvedValueOnce(undefined);
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
		const { deps, service } = setup();
		deps.findAttempt.mockResolvedValueOnce({ ...attempt, subtestAttempts: [] });
		await expect(service.start(1, 11, "user")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Selesaikan subtest sebelumnya terlebih dahulu",
		});
		expect(deps.createSubtestAttempt).not.toHaveBeenCalled();
	});
});
