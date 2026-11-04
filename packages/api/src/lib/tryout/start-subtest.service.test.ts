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
		const result = await service.start(1, 10, "user");
		expect(result).toEqual({ status: "started", attempt: { ...subtestAttempt, score: 75 } });
		expect(deps.createSubtestAttempt).not.toHaveBeenCalled();
	});

	test("starts the next subtest using the prior deadline, capped by the overall deadline", async () => {
		const { deps, service } = setup();
		expect((await service.start(1, 11, "user")).status).toBe("started");
		expect(deps.createSubtestAttempt).toHaveBeenCalledWith({ tryoutAttemptId: 2, subtestId: 11, deadline });
	});

	test("rejects missing attempts and unknown subtests", async () => {
		const { deps, service } = setup();
		deps.findAttempt.mockResolvedValueOnce(undefined);
		expect(await service.start(1, 10, "user")).toEqual({ status: "no_attempt" });
		expect(await service.start(1, 99, "user")).toEqual({ status: "no_subtest" });
	});

	test("rejects starting a subtest before its predecessor is finished", async () => {
		const { deps, service } = setup();
		deps.findAttempt.mockResolvedValueOnce({ ...attempt, subtestAttempts: [] });
		expect(await service.start(1, 11, "user")).toEqual({ status: "previous_unfinished" });
		expect(deps.createSubtestAttempt).not.toHaveBeenCalled();
	});
});
