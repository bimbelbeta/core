import { describe, expect, mock, test } from "bun:test";
import { createActiveSubtestService } from "./active-subtest.service";

const activeAttempt = {
	id: 42,
	subtestAttempts: [{ status: "ongoing" as const, deadline: new Date("2100-01-01") }],
};

describe("active subtest service", () => {
	test("returns the user's active attempt", async () => {
		const find = mock(async () => activeAttempt);
		const service = createActiveSubtestService(find);
		expect(await service.find(1, "user-1")).toEqual({ status: "active", attemptId: 42 });
		expect(find).toHaveBeenCalledWith(1, "user-1");
	});

	test("rejects missing attempts and missing active subtests", async () => {
		const missing = createActiveSubtestService(async () => undefined);
		const finished = createActiveSubtestService(async () => ({
			id: 42,
			subtestAttempts: [{ status: "finished", deadline: new Date(0) }],
		}));
		expect(await missing.find(1, "user-1")).toEqual({ status: "no_attempt" });
		expect(await finished.find(1, "user-1")).toEqual({ status: "no_subtest" });
	});

	test("rejects an expired subtest and permits a future deadline", async () => {
		const expired = createActiveSubtestService(async () => ({
			id: 42,
			subtestAttempts: [{ status: "ongoing", deadline: new Date(0) }],
		}));
		const future = createActiveSubtestService(async () => ({
			id: 42,
			subtestAttempts: [{ status: "ongoing", deadline: new Date("2100-01-01") }],
		}));
		expect(await expired.find(1, "user-1")).toEqual({ status: "expired" });
		expect(await future.find(1, "user-1")).toEqual({ status: "active", attemptId: 42 });
	});
});
