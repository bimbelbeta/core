import { afterAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { university } from "@bimbelbeta/db/schema/university";
import { call } from "@orpc/server";
import { like } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const testSessionId = `university-integration-${crypto.randomUUID()}`;
const slugPrefix = "university-integration-";
const now = new Date();
const session = {
	user: {
		id: testSessionId,
		name: testSessionId,
		email: `${testSessionId}@example.com`,
		emailVerified: false,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "admin",
		isPremium: false,
		premiumExpiresAt: null,
		tryoutCredits: 0,
		targetUniversityId: null,
		targetStudyProgramId: null,
	},
	session: {
		id: testSessionId,
		userId: testSessionId,
		token: testSessionId,
		expiresAt: new Date("2100-01-01"),
		createdAt: now,
		updatedAt: now,
		ipAddress: null,
		userAgent: null,
	},
} satisfies Session;
const options = { context: { session } };
const missingId = 999_999_999;

describe.skipIf(!enabled)("university feature integration", () => {
	afterAll(async () => {
		await db.delete(university).where(like(university.slug, `${slugPrefix}%`));
	});

	test("a bad university id still returns NOT_FOUND from every university find", async () => {
		await expect(call(appRouter.university.find, { id: missingId }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Universitas tidak ditemukan",
		});
		await expect(call(appRouter.admin.university.universities.find, { id: missingId }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Universitas tidak ditemukan",
		});
		await expect(call(appRouter.admin.university.studyPrograms.find, { id: missingId }, options)).rejects.toMatchObject(
			{
				code: "NOT_FOUND",
				message: "Program studi tidak ditemukan",
			},
		);
		await expect(
			call(appRouter.admin.university.universityPrograms.find, { id: missingId }, options),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Program universitas tidak ditemukan",
		});
		await expect(
			call(appRouter.admin.university.universityPrograms.removeYearlyData, { id: missingId, year: 2024 }, options),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Data tahunan tidak ditemukan",
		});
	});

	test("an admin can create and remove a university with the unchanged responses", async () => {
		const slug = `${slugPrefix}${crypto.randomUUID()}`;
		const created = await call(
			appRouter.admin.university.universities.create,
			{ name: "Universitas Uji Coba", slug },
			options,
		);
		expect(created.message).toBe("Universitas berhasil dibuat");
		expect(typeof created.id).toBe("number");

		const found = await call(appRouter.admin.university.universities.find, { id: created.id }, options);
		expect(found).toMatchObject({ name: "Universitas Uji Coba", slug, isActive: true });

		const updated = await call(
			appRouter.admin.university.universities.update,
			{ id: created.id, location: "Depok" },
			options,
		);
		expect(updated).toEqual({ message: "Universitas berhasil diperbarui" });

		const removed = await call(appRouter.admin.university.universities.remove, { id: created.id }, options);
		expect(removed).toEqual({ message: "Universitas berhasil dihapus" });

		await expect(call(appRouter.admin.university.universities.find, { id: created.id }, options)).rejects.toMatchObject(
			{
				code: "NOT_FOUND",
			},
		);
	});

	test("a member can browse universities and university programs", async () => {
		const universities = await call(appRouter.university.list, {}, options);
		expect(Array.isArray(universities.items)).toBe(true);
		expect(universities.pageInfo).toBeObject();

		const programs = await call(appRouter.university.listPrograms, {}, options);
		expect(Array.isArray(programs.items)).toBe(true);

		const adminPrograms = await call(appRouter.admin.university.universityPrograms.list, {}, options);
		expect(Array.isArray(adminPrograms.items)).toBe(true);
	});
});
