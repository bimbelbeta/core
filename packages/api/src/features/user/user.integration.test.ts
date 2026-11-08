import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `user-it-${crypto.randomUUID()}`;
const email = `${id}@example.com`;
const deletableId = `user-del-${crypto.randomUUID()}`;
const now = new Date();

const session = {
	user: {
		id,
		name: id,
		email,
		emailVerified: false,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "superadmin",
		isPremium: false,
		premiumExpiresAt: null,
		tryoutCredits: 1,
		targetUniversityId: null,
		targetStudyProgramId: null,
	},
	session: {
		id,
		userId: id,
		token: id,
		expiresAt: new Date("2100-01-01"),
		createdAt: now,
		updatedAt: now,
		ipAddress: null,
		userAgent: null,
	},
} satisfies Session;
const options = { context: { session } };

describe.skipIf(!enabled)("user feature", () => {
	let universityId = 0;
	let studyProgramId = 0;

	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email, role: "superadmin", tryoutCredits: 1 });
		await db
			.insert(user)
			.values({ id: deletableId, name: deletableId, email: `${deletableId}@example.com`, role: "user" });

		const [uni] = await db
			.insert(university)
			.values({ name: id, slug: `${id}-uni` })
			.returning();
		universityId = uni!.id;

		const [sp] = await db
			.insert(studyProgram)
			.values({ name: id, slug: `${id}-sp`, category: "SAINTEK" })
			.returning();
		studyProgramId = sp!.id;

		await db
			.insert(universityStudyProgram)
			.values({ universityId, studyProgramId, accreditation: "Unggul", averageScore: 600 });
	});

	beforeEach(async () => {
		await db
			.update(user)
			.set({
				isPremium: false,
				premiumExpiresAt: null,
				targetUniversityId: null,
				targetStudyProgramId: null,
			})
			.where(eq(user.id, id));
	});

	afterAll(async () => {
		await db.delete(user).where(eq(user.id, id));
		await db.delete(user).where(eq(user.id, deletableId));
		await db.delete(universityStudyProgram).where(eq(universityStudyProgram.universityId, universityId));
		await db.delete(studyProgram).where(eq(studyProgram.id, studyProgramId));
		await db.delete(university).where(eq(university.id, universityId));
	});

	test("returns null targets when the member has none", async () => {
		const result = await call(appRouter.userSettings.findTarget, undefined, options);
		expect(result).toEqual({ university: null, studyProgram: null });
	});

	test("returns null targets for a dangling target instead of a server error", async () => {
		const dangling = {
			context: {
				session: {
					...session,
					user: { ...session.user, targetUniversityId: 99999999, targetStudyProgramId: 99999999 },
				},
			},
		};
		const read = await call(appRouter.userSettings.findTarget, undefined, dangling);
		expect(read).toEqual({ university: null, studyProgram: null });
	});

	test("saves the member target and reads it back", async () => {
		const updated = await call(appRouter.userSettings.update, { universityId, studyProgramId }, options);
		expect(updated).toEqual({ id, targetUniversityId: universityId, targetStudyProgramId: studyProgramId });

		const [row] = await db.select().from(user).where(eq(user.id, id));
		expect(row!.targetUniversityId).toBe(universityId);
		expect(row!.targetStudyProgramId).toBe(studyProgramId);

		const targetSession = {
			context: {
				session: {
					...session,
					user: { ...session.user, targetUniversityId: universityId, targetStudyProgramId: studyProgramId },
				},
			},
		};
		const found = await call(appRouter.userSettings.findTarget, undefined, targetSession);
		expect(found).toMatchObject({
			university: { id: universityId, name: id, slug: `${id}-uni` },
			studyProgram: {
				id: studyProgramId,
				name: id,
				slug: `${id}-sp`,
				category: "SAINTEK",
				accreditation: "Unggul",
				averageScore: 600,
			},
		});
	});

	test("rejects an invalid university and program combination with BAD_REQUEST", async () => {
		const update = call(appRouter.userSettings.update, { universityId: 99999999, studyProgramId: 99999999 }, options);
		await expect(update).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	test("lists users by search and premium filter", async () => {
		const result = await call(appRouter.admin.users.list, { search: id }, options);
		expect(result.items.some((row) => row.id === id)).toBe(true);
		const premiumOnly = await call(appRouter.admin.users.list, { search: id, isPremium: true }, options);
		expect(premiumOnly.items.some((row) => row.id === id)).toBe(false);
	});

	test("finds a user with its credit history and reports NOT_FOUND for a missing one", async () => {
		const before = await call(appRouter.admin.users.find, { userId: id }, options);
		expect(before.user).toMatchObject({ id, email });
		expect(before.creditHistory).toEqual([]);

		await db.insert(creditTransaction).values({ userId: id, amount: 1, balanceAfter: 1, note: "integration" });
		const after = await call(appRouter.admin.users.find, { userId: id }, options);
		expect(after.creditHistory).toHaveLength(1);

		const missing = call(appRouter.admin.users.find, { userId: "no-such-user" }, options);
		await expect(missing).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	test("updates a user and reports NOT_FOUND for a missing one", async () => {
		const result = await call(
			appRouter.admin.users.update,
			{ userId: id, role: "admin", isPremium: true, premiumExpiresAt: new Date("2030-01-01") },
			options,
		);
		expect(result).toEqual({ message: "User berhasil diperbarui" });

		const [row] = await db.select().from(user).where(eq(user.id, id));
		expect(row!.role).toBe("admin");
		expect(row!.isPremium).toBe(true);
		expect(row!.premiumExpiresAt).toEqual(new Date("2030-01-01"));

		const missing = call(appRouter.admin.users.update, { userId: "no-such-user", role: "user" }, options);
		await expect(missing).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	test("deletes a batch of users and refuses an empty batch", async () => {
		const result = await call(appRouter.admin.users.deleteBatch, { userIds: [deletableId] }, options);
		expect(result).toEqual({ message: "1 user berhasil dihapus" });

		const [row] = await db.select().from(user).where(eq(user.id, deletableId));
		expect(row).toBeUndefined();

		const empty = call(appRouter.admin.users.deleteBatch, { userIds: [] }, options);
		await expect(empty).rejects.toMatchObject({ code: "UNPROCESSABLE_CONTENT" });
	});

	test("downgrades an expired premium session on an authenticated read", async () => {
		const expiredAt = new Date("2020-01-01");
		await db.update(user).set({ isPremium: true, premiumExpiresAt: expiredAt }).where(eq(user.id, id));

		const expiredSession = {
			context: {
				session: {
					...session,
					user: { ...session.user, isPremium: true, premiumExpiresAt: expiredAt },
				},
			},
		};
		await call(appRouter.tryout.history, undefined, expiredSession);

		const [after] = await db.select().from(user).where(eq(user.id, id));
		expect(after!.isPremium).toBe(false);
	});
});
