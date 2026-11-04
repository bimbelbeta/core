import type { auth } from "@bimbelbeta/auth";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { tryoutAccessCode, tryoutAttempt, tryoutSubtestAttempt } from "@bimbelbeta/db/schema/tryout";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { hashAccessCode } from "@/lib/access-code";
import { tryoutErrors as errors } from "@/lib/tryout/tryout-error";
import { parseNullableInt } from "@/lib/utils";

export async function startTryout(
	input: { id: number; imageUrl?: string; useCredit?: boolean; accessCode?: string },
	userData: Pick<typeof auth.$Infer.Session.user, "id" | "isPremium" | "tryoutCredits">,
) {
	const tryoutData = await db.query.tryout.findFirst({
		where: {
			id: { eq: input.id },
			status: { eq: "published" },
		},
		with: {
			subtests: {
				orderBy: (subtests, { asc }) => [asc(subtests.order)],
			},
		},
	});

	if (!tryoutData) throw errors.NOT_FOUND({ message: "Tryout tidak ditemukan" });

	// Access control: Premium users OR users with image OR users with credits
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
		validAccessCode =
			(await db.query.tryoutAccessCode.findFirst({
				where: {
					tryoutId: { eq: input.id },
					codeHash: { eq: codeHash },
				},
				columns: {
					id: true,
					isActive: true,
					expiresAt: true,
					maxUses: true,
					usedCount: true,
				},
			})) ?? null;

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

	const existingAttempt = await db.query.tryoutAttempt.findFirst({
		where: {
			tryoutId: { eq: input.id },
			userId: { eq: userData.id },
		},
	});

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
	const attempt = await db.transaction(async (trx) => {
		const [newAttempt] = await trx
			.insert(tryoutAttempt)
			.values({
				tryoutId: input.id,
				userId: userData.id,
				submittedImageUrl: usesCredit ? null : input.imageUrl,
				deadline: overallDeadline,
				usedCredit: usesCredit,
				usedAccessCode: usesAccessCode,
				accessCodeId: validAccessCode?.id ?? null,
			})
			.returning();

		if (!newAttempt) throw errors.INTERNAL_SERVER_ERROR({ message: "Gagal membuat pengerjaan" });

		if (validAccessCode) {
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
