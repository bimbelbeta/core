import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { referralCode, referralUsage } from "@bimbelbeta/db/schema/referral";
import { and, eq, sql } from "drizzle-orm";
import { authedImplementer } from "@/lib/router-definition";

const authed = authedImplementer;

const redeem = authed.referral.redeem.handler(async ({ input, context, errors }) => {
	const code = input.code.toUpperCase();
	const userId = context.session.user.id;

	const result = await db.transaction(async (tx) => {
		const [codeRow] = await tx.select().from(referralCode).where(eq(referralCode.code, code)).for("update").limit(1);

		if (!codeRow) {
			throw errors.NOT_FOUND({ message: "Kode tidak ditemukan / salah." });
		}

		if (!codeRow.status) {
			throw errors.UNPROCESSABLE_CONTENT({ message: "Kode tidak valid atau sudah dinonaktifkan." });
		}

		if (codeRow.validUntil && codeRow.validUntil < new Date()) {
			throw errors.UNPROCESSABLE_CONTENT({ message: "Kode sudah kedaluwarsa." });
		}

		if (codeRow.maxUsages !== null && codeRow.usageCount >= codeRow.maxUsages) {
			throw errors.UNPROCESSABLE_CONTENT({ message: "Kuota kode sudah habis." });
		}

		const [existingUsage] = await tx
			.select({ id: referralUsage.id })
			.from(referralUsage)
			.where(and(eq(referralUsage.userId, userId), eq(referralUsage.referralCodeId, codeRow.id)))
			.limit(1);

		if (existingUsage) {
			throw errors.UNPROCESSABLE_CONTENT({ message: "Anda sudah pernah menggunakan kode ini." });
		}

		await tx.insert(referralUsage).values({
			id: crypto.randomUUID(),
			userId,
			referralCodeId: codeRow.id,
		});

		await tx
			.update(referralCode)
			.set({ usageCount: sql`${referralCode.usageCount} + 1`, updatedAt: new Date() })
			.where(eq(referralCode.id, codeRow.id));

		const [currentUser] = await tx
			.select({ isPremium: user.isPremium, premiumExpiresAt: user.premiumExpiresAt })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		const now = new Date();
		const baseDate =
			currentUser?.isPremium && currentUser.premiumExpiresAt && currentUser.premiumExpiresAt > now
				? currentUser.premiumExpiresAt
				: now;

		const newPremiumExpiresAt = new Date(baseDate.getTime() + codeRow.premiumDays * 24 * 60 * 60 * 1000);

		await tx
			.update(user)
			.set({ isPremium: true, premiumExpiresAt: newPremiumExpiresAt, updatedAt: new Date() })
			.where(eq(user.id, userId));

		return { newPremiumExpiresAt };
	});

	return {
		message: `Selamat! Akun Premium Anda aktif hingga ${result.newPremiumExpiresAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`,
		premiumExpiresAt: result.newPremiumExpiresAt,
	};
});

export const referralRouter = {
	redeem,
};
