import { describe, expect, test } from "bun:test";
import { type SubmitServiceDependencies, submitSubtest, submitTryout } from "./submit.service";

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
	tryout: null,
};

function deps(overrides: Partial<SubmitServiceDependencies> = {}): SubmitServiceDependencies {
	return {
		findAttempt: async () => undefined,
		runInTransaction: async () => {
			throw new Error("unexpected transaction");
		},
		calculateScores: async () => ({ subtests: [], totalScore: 0 }),
		saveScores: async () => {},
		...overrides,
	};
}

describe("tryout submission", () => {
	test("requires an active attempt for both submission workflows", async () => {
		await expect(submitSubtest({ tryoutId: 2, subtestId: 3 }, "user-1", deps())).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Gagal menemukan pengerjaan tryout.",
		});
		await expect(submitTryout({ tryoutId: 2 }, "user-1", deps())).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Gagal menemukan pengerjaan tryout.",
		});
	});

	test("rejects submission of an inactive subtest", async () => {
		const withAttempt = deps({ findAttempt: async () => attempt });
		await expect(submitSubtest({ tryoutId: 2, subtestId: 3 }, "user-1", withAttempt)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Subtest tidak aktif",
		});
	});
});
