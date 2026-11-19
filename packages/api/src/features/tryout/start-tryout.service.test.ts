import { describe, expect, test } from "bun:test";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import type { AttemptInsert, AttemptRow, TryoutWithSubtests } from "./repository";
import type { StartTryoutDependencies, StartTryoutRepository } from "./start-tryout.service";
import { createStartTryoutService } from "./start-tryout.service";

const caller: Session["user"] = {
	id: "user-1",
	name: "user-1",
	email: "user-1@example.com",
	emailVerified: false,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	role: "user",
	isPremium: false,
	premiumExpiresAt: null,
	tryoutCredits: 2,
	targetUniversityId: null,
	targetStudyProgramId: null,
};
const subtests = [
	{
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
	},
];
const tryout: TryoutWithSubtests = {
	id: 1,
	title: "Tryout",
	description: null,
	passingGrade: 600,
	category: "utbk" as const,
	status: "published" as const,
	startsAt: null,
	endsAt: null,
	createdAt: null,
	updatedAt: null,
	subtests,
};
const attemptRow: AttemptRow = {
	id: 99,
	userId: "user-1",
	tryoutId: 1,
	attemptNumber: 1,
	startedAt: new Date(),
	deadline: new Date("2100-01-01"),
	completedAt: null,
	breakEndsAt: null,
	status: "ongoing" as const,
	score: null,
	submittedImageUrl: null,
	isRevoked: false,
	usedCredit: false,
	usedAccessCode: false,
	accessCodeId: null,
};

type InsertedAttempt = AttemptInsert;
type InsertedSubtestAttempt = { tryoutAttemptId: number; subtestId: number; deadline: Date };
type Deduction = { userId: string; tryoutAttemptId: number; note: string };

type RepositoryRows = {
	tryout?: TryoutWithSubtests | undefined;
	attempts?: Array<AttemptRow | undefined>;
	attempt?: AttemptRow | undefined;
	insertConflict?: boolean;
	insertedAttempts: InsertedAttempt[];
	insertedSubtestAttempts: InsertedSubtestAttempt[];
	deductions: Deduction[];
};

function makeRepository(rows: RepositoryRows) {
	const pending = rows.attempts ? [...rows.attempts] : [];
	return {
		findPublishedTryoutWithSubtests: async () => rows.tryout,
		findAttempt: async () => (pending.length > 0 ? pending.shift() : rows.attempt),
		insertAttempt: async (values: InsertedAttempt) => {
			rows.insertedAttempts.push(values);
			if (rows.insertConflict) return undefined;
			return { ...attemptRow, ...values };
		},
		insertSubtestAttempt: async (values: InsertedSubtestAttempt) => {
			rows.insertedSubtestAttempts.push(values);
			return {
				id: 6,
				tryoutAttemptId: values.tryoutAttemptId,
				subtestId: values.subtestId,
				startedAt: new Date(),
				completedAt: null,
				deadline: values.deadline,
				status: "ongoing" as const,
				score: null,
				autoSubmitted: false,
			};
		},
	};
}

function makeService(rows: RepositoryRows) {
	const repository: StartTryoutRepository = makeRepository(rows);
	const withTransaction: StartTryoutDependencies["withTransaction"] = async (fn) =>
		fn({
			repository,
			credit: {
				deductCreditForTryoutAttempt: async (deduction: Deduction) => {
					rows.deductions.push(deduction);
					return { balanceAfter: 1 };
				},
			},
		});
	return { service: createStartTryoutService({ repository, withTransaction }), repository };
}

function emptyRows(overrides: Partial<RepositoryRows> = {}): RepositoryRows {
	return {
		tryout,
		insertedAttempts: [],
		insertedSubtestAttempts: [],
		deductions: [],
		...overrides,
	};
}

describe("start tryout service", () => {
	test("rejects a missing published tryout", async () => {
		const rows = emptyRows({ tryout: undefined });
		const { service } = makeService(rows);
		await expect(service.start({ id: 1 }, caller)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
		await expect(service.start({ id: 1 }, caller)).rejects.toBeInstanceOf(DomainError);
	});

	test("rejects a tryout outside its open window", async () => {
		const notOpen = emptyRows({ tryout: { ...tryout, startsAt: new Date("2100-01-01") } });
		const { service: notOpenService } = makeService(notOpen);
		await expect(notOpenService.start({ id: 1 }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout belum dimulai",
		});

		const closed = emptyRows({ tryout: { ...tryout, endsAt: new Date("2000-01-01") } });
		const { service: closedService } = makeService(closed);
		await expect(closedService.start({ id: 1 }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout sudah selesai",
		});
	});

	test("starts a tryout for free and opens the first subtest", async () => {
		const rows = emptyRows();
		const { service } = makeService(rows);

		const result = await service.start({ id: 1 }, { ...caller, tryoutCredits: 0, isPremium: false });

		expect(result).toMatchObject({
			id: 99,
			submittedImageUrl: null,
			usedCredit: false,
			usedAccessCode: false,
			accessCodeId: null,
			score: null,
		});
		if (!("overallDeadline" in result) || !result.overallDeadline) {
			throw new Error("expected an overallDeadline on a new attempt");
		}
		expect(result.overallDeadline.getTime()).toBeGreaterThan(Date.now());
		expect(rows.deductions).toEqual([]);
		expect(rows.insertedAttempts).toEqual([
			{
				tryoutId: 1,
				userId: "user-1",
				submittedImageUrl: null,
				deadline: result.overallDeadline,
				usedCredit: false,
				usedAccessCode: false,
				accessCodeId: null,
			},
		]);
		expect(rows.insertedSubtestAttempts).toEqual([
			{ tryoutAttemptId: 99, subtestId: 10, deadline: result.overallDeadline },
		]);
	});

	test("ignores legacy access inputs without charging credits or storing proofs", async () => {
		const rows = emptyRows();
		const { service } = makeService(rows);

		const result = await service.start({ id: 1, imageUrl: "proof.png", useCredit: true, accessCode: "CODE" }, caller);

		expect(result).toMatchObject({
			id: 99,
			submittedImageUrl: null,
			usedCredit: false,
			usedAccessCode: false,
			accessCodeId: null,
		});
		expect(rows.deductions).toEqual([]);
		expect(rows.insertedAttempts[0]).toMatchObject({
			submittedImageUrl: null,
			usedCredit: false,
			usedAccessCode: false,
			accessCodeId: null,
		});
		expect(rows.insertedSubtestAttempts).toHaveLength(1);
	});

	test("returns the attempt that already exists without starting another", async () => {
		const existing: AttemptRow = { ...attemptRow, id: 42, score: "700", isRevoked: false };
		const rows = emptyRows({ attempts: [existing] });
		const { service } = makeService(rows);

		expect(await service.start({ id: 1 }, caller)).toMatchObject({ id: 42, score: 700 });
		expect(rows.insertedAttempts).toEqual([]);
		expect(rows.insertedSubtestAttempts).toEqual([]);
	});

	test("rejects a revoked attempt", async () => {
		const revoked: AttemptRow = { ...attemptRow, isRevoked: true };
		const rows = emptyRows({ attempts: [revoked] });
		const { service } = makeService(rows);

		await expect(service.start({ id: 1 }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Pengerjaan telah dibatalkan",
		});
	});

	test("returns the existing attempt when insertAttempt hits a concurrent conflict", async () => {
		const existing: AttemptRow = { ...attemptRow, id: 55, score: "750", isRevoked: false };
		const rows = emptyRows({
			attempts: [undefined, existing],
			insertConflict: true,
		});
		const { service } = makeService(rows);

		const result = await service.start({ id: 1 }, caller);

		expect(result).toMatchObject({ id: 55, score: 750 });
		expect("overallDeadline" in result).toBe(false);
		expect(rows.insertedSubtestAttempts).toEqual([]);
	});

	test("rejects a revoked attempt found after a concurrent insert conflict", async () => {
		const revoked: AttemptRow = { ...attemptRow, isRevoked: true };
		const rows = emptyRows({
			attempts: [undefined, revoked],
			insertConflict: true,
		});
		const { service } = makeService(rows);

		await expect(service.start({ id: 1 }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Pengerjaan telah dibatalkan",
		});
		expect(rows.insertedSubtestAttempts).toEqual([]);
	});

	test("rejects a tryout without subtests", async () => {
		const rows = emptyRows({ tryout: { ...tryout, subtests: [] } });
		const { service } = makeService(rows);

		await expect(service.start({ id: 1 }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout tidak memiliki subtest",
		});
		expect(rows.insertedAttempts).toEqual([]);
	});

	test("includes (subtests.length - 1) * 60_000 break buffer in overallDeadline for multi-subtest tryouts", async () => {
		const multiSubtests = [
			{ ...subtests[0]!, id: 10, order: 1, duration: 30 },
			{ ...subtests[0]!, id: 11, order: 2, duration: 20 },
			{ ...subtests[0]!, id: 12, order: 3, duration: 15 },
		];
		const rows = emptyRows({ tryout: { ...tryout, subtests: multiSubtests } });
		const { service } = makeService(rows);

		const result = await service.start({ id: 1 }, caller);
		if (!("overallDeadline" in result) || !result.overallDeadline) {
			throw new Error("expected an overallDeadline on a new attempt");
		}
		const firstDeadline = rows.insertedSubtestAttempts[0]!.deadline;
		expect(result.overallDeadline.getTime() - firstDeadline.getTime()).toBe((20 + 15 + 2) * 60_000);
		expect(rows.insertedSubtestAttempts).toEqual([{ tryoutAttemptId: 99, subtestId: 10, deadline: firstDeadline }]);
	});
});
