import { describe, expect, test } from "bun:test";
import type { Session } from "@/context";
import { DomainError } from "@/lib/domain-error";
import type { AccessCodeSummary, AttemptInsert, AttemptRow, TryoutWithSubtests } from "./repository";
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
const accessCode: AccessCodeSummary = { id: 7, isActive: true, expiresAt: null, maxUses: 5, usedCount: 0 };
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
	accessCode?: AccessCodeSummary | undefined;
	attempts?: Array<AttemptRow | undefined>;
	attempt?: AttemptRow | undefined;
	quotaLeft: boolean;
	insertedAttempts: InsertedAttempt[];
	insertedSubtestAttempts: InsertedSubtestAttempt[];
	consumedCodes: number[];
	deductions: Deduction[];
};

function makeRepository(rows: RepositoryRows) {
	const pending = rows.attempts ? [...rows.attempts] : [];
	return {
		findPublishedTryoutWithSubtests: async () => rows.tryout,
		findAccessCode: async () => rows.accessCode,
		findAttempt: async () => (pending.length > 0 ? pending.shift() : rows.attempt),
		insertAttempt: async (values: InsertedAttempt) => {
			rows.insertedAttempts.push(values);
			return { ...attemptRow, ...values };
		},
		consumeAccessCodeQuota: async (codeId: number) => {
			rows.consumedCodes.push(codeId);
			return rows.quotaLeft ? { id: codeId } : undefined;
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
		accessCode,
		quotaLeft: true,
		insertedAttempts: [],
		insertedSubtestAttempts: [],
		consumedCodes: [],
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

	test("enforces access and credit requirements before creating an attempt", async () => {
		const rows = emptyRows({ accessCode: undefined });
		const { service } = makeService(rows);
		await expect(service.start({ id: 1 }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses",
		});
		await expect(service.start({ id: 1, useCredit: true }, { ...caller, tryoutCredits: 0 })).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kredit tryout tidak cukup",
		});
		expect(rows.insertedAttempts).toEqual([]);
	});

	test("rejects a tryout outside its open window", async () => {
		const notOpen = emptyRows({ tryout: { ...tryout, startsAt: new Date("2100-01-01") } });
		const { service: notOpenService } = makeService(notOpen);
		await expect(notOpenService.start({ id: 1, imageUrl: "proof" }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout belum dimulai",
		});

		const closed = emptyRows({ tryout: { ...tryout, endsAt: new Date("2000-01-01") } });
		const { service: closedService } = makeService(closed);
		await expect(closedService.start({ id: 1, imageUrl: "proof" }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout sudah selesai",
		});
	});

	test("rejects an unusable access code when the code is the only access path", async () => {
		const invalid = emptyRows({ accessCode: undefined });
		const { service: invalidService } = makeService(invalid);
		await expect(invalidService.start({ id: 1, accessCode: "NOPE" }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kode akses tidak valid",
		});

		const inactive = emptyRows({ accessCode: { ...accessCode, isActive: false } });
		const { service: inactiveService } = makeService(inactive);
		await expect(inactiveService.start({ id: 1, accessCode: "CODE" }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kode akses tidak aktif",
		});

		const expired = emptyRows({ accessCode: { ...accessCode, expiresAt: new Date(0) } });
		const { service: expiredService } = makeService(expired);
		await expect(expiredService.start({ id: 1, accessCode: "CODE" }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kode akses sudah kedaluwarsa",
		});

		const exhausted = emptyRows({ accessCode: { ...accessCode, maxUses: 2, usedCount: 2 } });
		const { service: exhaustedService } = makeService(exhausted);
		await expect(exhaustedService.start({ id: 1, accessCode: "CODE" }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kuota kode akses sudah habis",
		});
	});

	test("consumes an access code and opens the first subtest", async () => {
		const rows = emptyRows();
		const { service } = makeService(rows);

		const result = await service.start({ id: 1, accessCode: "CODE" }, caller);

		expect(result).toMatchObject({ id: 99, usedAccessCode: true, usedCredit: false, accessCodeId: 7 });
		if (!("overallDeadline" in result)) throw new Error("expected an overallDeadline on a new attempt");
		expect(result.overallDeadline.getTime()).toBeGreaterThan(Date.now());
		expect(rows.consumedCodes).toEqual([7]);
		expect(rows.deductions).toEqual([]);
		expect(rows.insertedSubtestAttempts).toEqual([
			{ tryoutAttemptId: 99, subtestId: 10, deadline: result.overallDeadline },
		]);
	});

	test("deducts one credit through the credit repository inside the same transaction", async () => {
		const rows = emptyRows();
		const { service } = makeService(rows);

		const result = await service.start({ id: 1, useCredit: true }, caller);

		expect(result).toMatchObject({ id: 99, usedCredit: true, usedAccessCode: false, accessCodeId: null });
		expect(rows.deductions).toEqual([{ userId: "user-1", tryoutAttemptId: 99, note: "Used for tryout: Tryout" }]);
		expect(rows.consumedCodes).toEqual([]);
		expect(rows.insertedSubtestAttempts).toHaveLength(1);
		expect(rows.insertedAttempts[0]).toMatchObject({ submittedImageUrl: null, usedCredit: true });
	});

	test("never deducts a credit from a premium user", async () => {
		const rows = emptyRows();
		const { service } = makeService(rows);

		const result = await service.start({ id: 1, useCredit: true }, { ...caller, isPremium: true, tryoutCredits: 0 });

		expect(result).toMatchObject({ usedCredit: false, usedAccessCode: false });
		expect(rows.deductions).toEqual([]);
		expect(rows.insertedSubtestAttempts).toHaveLength(1);
	});

	test("keeps an attempt started with image proof off the credit and code paths", async () => {
		const rows = emptyRows();
		const { service } = makeService(rows);

		const result = await service.start({ id: 1, imageUrl: "proof.png" }, caller);

		expect(result).toMatchObject({ usedCredit: false, usedAccessCode: false, accessCodeId: null });
		expect(rows.insertedAttempts[0]).toMatchObject({ submittedImageUrl: "proof.png" });
		expect(rows.deductions).toEqual([]);
		expect(rows.consumedCodes).toEqual([]);
	});

	test("does not spend the code quota when access already came from elsewhere", async () => {
		const premium = emptyRows();
		const { service: premiumService } = makeService(premium);
		const result = await premiumService.start({ id: 1, accessCode: "CODE" }, { ...caller, isPremium: true });
		expect(result).toMatchObject({ usedAccessCode: false, accessCodeId: null });
		expect(premium.consumedCodes).toEqual([]);

		const imageProof = emptyRows({ accessCode: undefined });
		const { service: imageService } = makeService(imageProof);
		const imageResult = await imageService.start({ id: 1, accessCode: "NOPE", imageUrl: "proof" }, caller);
		expect(imageResult).toMatchObject({ usedAccessCode: false, accessCodeId: null });
		expect(imageProof.consumedCodes).toEqual([]);
	});

	test("does not spend the code quota when a credit pays for the attempt", async () => {
		const rows = emptyRows();
		const { service } = makeService(rows);

		const result = await service.start({ id: 1, accessCode: "CODE", useCredit: true }, caller);

		expect(result).toMatchObject({ usedCredit: true, usedAccessCode: false, accessCodeId: null });
		expect(rows.consumedCodes).toEqual([]);
		expect(rows.deductions).toHaveLength(1);
	});

	test("aborts the whole start when the access code quota is exhausted", async () => {
		const rows = emptyRows({ quotaLeft: false });
		const { service } = makeService(rows);

		await expect(service.start({ id: 1, accessCode: "CODE" }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Kuota kode akses sudah habis",
		});
		expect(rows.insertedSubtestAttempts).toEqual([]);
	});

	test("returns the attempt that already exists without starting another", async () => {
		const existing: AttemptRow = { ...attemptRow, id: 42, score: "700", isRevoked: false };
		const rows = emptyRows({ attempts: [existing] });
		const { service } = makeService(rows);

		expect(await service.start({ id: 1, imageUrl: "proof" }, caller)).toMatchObject({ id: 42, score: 700 });
		expect(rows.insertedAttempts).toEqual([]);
		expect(rows.insertedSubtestAttempts).toEqual([]);
	});

	test("rejects a revoked attempt", async () => {
		const revoked: AttemptRow = { ...attemptRow, isRevoked: true };
		const rows = emptyRows({ attempts: [revoked] });
		const { service } = makeService(rows);

		await expect(service.start({ id: 1, imageUrl: "proof" }, caller)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Pengerjaan telah dibatalkan",
		});
	});

	test("rejects a tryout without subtests", async () => {
		const rows = emptyRows({ tryout: { ...tryout, subtests: [] } });
		const { service } = makeService(rows);

		await expect(service.start({ id: 1, imageUrl: "proof" }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Tryout tidak memiliki subtest",
		});
		expect(rows.insertedAttempts).toEqual([]);
	});
});
