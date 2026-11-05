import type { auth } from "@bimbelbeta/auth";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { tryoutAccessCode, tryoutAttempt, tryoutSubtestAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { hashAccessCode } from "@/lib/access-code";
import { tryoutErrors as errors } from "@/lib/tryout/tryout-error";
import { parseNullableInt } from "@/lib/utils";

const dependencies = {
	findTryout: async (id: number) =>
		db.query.tryout.findFirst({
			where: { id: { eq: id }, status: { eq: "published" } },
			with: { subtests: { orderBy: (subtests, { asc }) => [asc(subtests.order)] } },
		}),
	findAccessCode: async (tryoutId: number, codeHash: string) =>
		db.query.tryoutAccessCode.findFirst({
			where: { tryoutId: { eq: tryoutId }, codeHash: { eq: codeHash } },
			columns: { id: true, isActive: true, expiresAt: true, maxUses: true, usedCount: true },
		}),
	findAttempt: async (tryoutId: number, userId: string) =>
		db.query.tryoutAttempt.findFirst({
			where: { tryoutId: { eq: tryoutId }, userId: { eq: userId } },
		}),
	runInTransaction: <T>(fn: (trx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>) =>
		db.transaction(fn),
};

export type StartTryoutDependencies = typeof dependencies;

/**
 * Creates a user's first attempt at a published tryout, or returns the attempt that already exists.
 *
 * Access is granted through any one of four paths: an active premium account, a payment proof
 * image, a tryout credit, or a valid access code. A credit is only deducted when the user asks
 * for it and is not already premium, so paying members never lose credits.
 *
 * Deadlines are cumulative: each subtest's deadline is the running total of every duration up to
 * and including that subtest, measured from the moment the tryout starts. Only the first subtest
 * attempt is created here; later ones are created when a subtest is submitted.
 *
 * The attempt row, access-code counter, credit deduction, ledger entry, and first subtest attempt
 * are written inside one transaction, so a failing quota check or credit update leaves no
 * partially started attempt behind.
 *
 * Throws a `TryoutError` for every expected failure (missing tryout, rejected access, closed
 * window, revoked attempt) so the procedure can map it to an oRPC error.
 *
 * @param input Requested tryout id plus the optional access proof the user supplied.
 * @param userData The caller's identity, premium flag, and current credit balance.
 * @returns The attempt with its score normalized to a number, plus the overall deadline.
 */
export async function startTryout(
	input: { id: number; imageUrl?: string; useCredit?: boolean; accessCode?: string },
	userData: Pick<typeof auth.$Infer.Session.user, "id" | "isPremium" | "tryoutCredits">,
	deps: StartTryoutDependencies = dependencies,
) {
	const tryoutData = await deps.findTryout(input.id);

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

	const isPremiumUser = userData.isPremium;
	const hasImageProof = !!input.imageUrl;
	const wantsToUseCredit = !!input.useCredit;
	const userCredits = userData.tryoutCredits ?? 0;

	const accessCodeInput = input.accessCode?.trim();
	const now = new Date();

	let validAccessCode: {
		id: number;
		isActive: boolean;
		expiresAt: Date | null;
		maxUses: number | null;
		usedCount: number;
	} | null = null;

	if (accessCodeInput) {
		const codeHash = hashAccessCode(accessCodeInput);
		validAccessCode = (await deps.findAccessCode(input.id, codeHash)) ?? null;

		if (!validAccessCode) {
			throw errors.FORBIDDEN({ message: "Kode akses tidak valid" });
		}

		if (!validAccessCode.isActive) {
			throw errors.FORBIDDEN({ message: "Kode akses tidak aktif" });
		}

		if (validAccessCode.expiresAt && validAccessCode.expiresAt < now) {
			throw errors.FORBIDDEN({ message: "Kode akses sudah kedaluwarsa" });
		}

		if (validAccessCode.maxUses !== null && validAccessCode.usedCount >= validAccessCode.maxUses) {
			throw errors.FORBIDDEN({ message: "Kuota kode akses sudah habis" });
		}
	}

	const usesAccessCode = !!validAccessCode && !wantsToUseCredit;

	if (!isPremiumUser && !hasImageProof && !wantsToUseCredit && !usesAccessCode) {
		throw errors.FORBIDDEN({
			message: "Upload bukti pembayaran, gunakan kredit tryout, atau masukkan kode akses",
		});
	}

	if (wantsToUseCredit && userCredits <= 0) {
		throw errors.FORBIDDEN({
			message: "Kredit tryout tidak cukup",
		});
	}

	const usesCredit = wantsToUseCredit && !isPremiumUser;
	if (tryoutData.startsAt && tryoutData.startsAt > now) {
		throw errors.BAD_REQUEST({
			message: "Tryout belum dimulai",
		});
	}
	if (tryoutData.endsAt && tryoutData.endsAt < now) {
		throw errors.BAD_REQUEST({
			message: "Tryout sudah selesai",
		});
	}

	const existingAttempt = await deps.findAttempt(input.id, userData.id);

	if (existingAttempt) {
		if (existingAttempt.isRevoked) {
			throw errors.FORBIDDEN({ message: "Pengerjaan telah dibatalkan" });
		}
		return {
			...existingAttempt,
			score: parseNullableInt(existingAttempt.score),
		};
	}

	if (tryoutData.subtests.length === 0) {
		throw errors.BAD_REQUEST({ message: "Tryout tidak memiliki subtest" });
	}

	let cumulativeMinutes = 0;
	const deadlineMap = new Map<number, Date>();

	for (const subtest of tryoutData.subtests) {
		cumulativeMinutes += subtest.duration;
		const deadline = new Date(now.getTime() + cumulativeMinutes * 60 * 1000);
		deadlineMap.set(subtest.id, deadline);
	}

	const overallDeadline = deadlineMap.get(tryoutData.subtests[tryoutData.subtests.length - 1]!.id)!;

	// Use a transaction to atomically create attempt and deduct credits if needed
	const attempt = await deps.runInTransaction(async (trx) => {
		const [newAttempt] = await trx
			.insert(tryoutAttempt)
			.values({
				tryoutId: input.id,
				userId: userData.id,
				submittedImageUrl: usesCredit ? null : input.imageUrl,
				deadline: overallDeadline,
				usedCredit: usesCredit,
				usedAccessCode: usesAccessCode,
				accessCodeId: usesAccessCode ? (validAccessCode?.id ?? null) : null,
			})
			.returning();

		if (!newAttempt) throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat pengerjaan" });

		if (usesAccessCode && validAccessCode) {
			const code = validAccessCode;
			const [updatedCode] = await trx
				.update(tryoutAccessCode)
				.set({
					usedCount: sql`${tryoutAccessCode.usedCount} + 1`,
				})
				.where(
					and(
						eq(tryoutAccessCode.id, code.id),
						or(isNull(tryoutAccessCode.maxUses), sql`${tryoutAccessCode.usedCount} < ${tryoutAccessCode.maxUses}`),
					),
				)
				.returning({ id: tryoutAccessCode.id });

			if (!updatedCode) {
				throw errors.FORBIDDEN({
					message: "Kuota kode akses sudah habis",
				});
			}
		}

		if (usesCredit) {
			const [updatedUser] = await trx
				.update(user)
				.set({
					tryoutCredits: sql`${user.tryoutCredits} - 1`,
				})
				.where(eq(user.id, userData.id))
				.returning({ tryoutCredits: user.tryoutCredits });

			await trx.insert(creditTransaction).values({
				userId: userData.id,
				tryoutAttemptId: newAttempt.id,
				amount: -1,
				balanceAfter: updatedUser?.tryoutCredits ?? 0,
				note: `Used for tryout: ${tryoutData.title}`,
			});
		}

		const firstSubtest = tryoutData.subtests[0]!;
		await trx.insert(tryoutSubtestAttempt).values({
			tryoutAttemptId: newAttempt.id,
			subtestId: firstSubtest.id,
			deadline: deadlineMap.get(firstSubtest.id)!,
		});

		return newAttempt;
	});

	return {
		...attempt,
		score: parseNullableInt(attempt.score),
		overallDeadline,
	};
}
