import { describe, expect, mock, test } from "bun:test";
import { createActiveSubtestService } from "./active-subtest.service";

const activeAttempt = {
	id: 42,
	subtestAttempts: [{ status: "ongoing" as const, deadline: new Date("2100-01-01") }],
};

describe("active subtest service", () => {
	test("returns the user's active attempt", async () => {
		const find = mock(async () => activeAttempt);
		const service = createActiveSubtestService({ findAttempt: find });
		expect(await service.require(1, "user-1")).toBe(42);
		expect(find).toHaveBeenCalledWith(1, "user-1");
	});

	test("rejects missing attempts and missing active subtests", async () => {
		const missing = createActiveSubtestService({ findAttempt: async () => undefined });
		const finished = createActiveSubtestService({
			findAttempt: async () => ({
				id: 42,
				subtestAttempts: [{ status: "finished", deadline: new Date(0) }],
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
			findAttempt: async () => ({
				id: 42,
				subtestAttempts: [{ status: "ongoing", deadline: new Date(0) }],
			}),
		});
		const future = createActiveSubtestService({
			findAttempt: async () => ({
				id: 42,
				subtestAttempts: [{ status: "ongoing", deadline: new Date("2100-01-01") }],
			}),
		});
		await expect(expired.require(1, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Batas waktu subtest telah habis",
		});
		expect(await future.require(1, "user-1")).toBe(42);
	});
});
