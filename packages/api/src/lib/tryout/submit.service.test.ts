import { afterAll, afterEach, describe, expect, spyOn, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { submitSubtest, submitTryout } from "./submit.service";

const findAttempt = spyOn(db.query.tryoutAttempt, "findFirst");
const attempt = {
	id: 1,
	userId: "user-1",
	tryoutId: 2,
	startedAt: new Date(),
	deadline: new Date("2100-01-01"),
	completedAt: null,
	status: "ongoing" as const,
	score: null,
	submittedImageUrl: null,
	isRevoked: false,
	usedCredit: false,
	usedAccessCode: false,
	accessCodeId: null,
	subtestAttempts: [],
};

afterEach(() => findAttempt.mockReset());
afterAll(() => findAttempt.mockRestore());

describe("tryout submission", () => {
	test("requires an active attempt for both submission workflows", async () => {
		findAttempt.mockResolvedValueOnce(undefined);
		await expect(submitSubtest({ tryoutId: 2, subtestId: 3 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Gagal menemukan pengerjaan tryout.",
		});
		findAttempt.mockResolvedValueOnce(undefined);
		await expect(submitTryout({ tryoutId: 2 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Gagal menemukan pengerjaan tryout.",
		});
	});

	test("rejects submission of an inactive subtest", async () => {
		findAttempt.mockResolvedValueOnce(attempt);
		await expect(submitSubtest({ tryoutId: 2, subtestId: 3 }, "user-1")).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Subtest tidak aktif",
		});
	});
});
