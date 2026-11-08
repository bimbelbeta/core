import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { subject } from "@bimbelbeta/db/schema/subject";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `content-integration-${crypto.randomUUID()}`;
const now = new Date();
const session = {
	user: {
		id,
		name: id,
		email: `${id}@example.com`,
		emailVerified: false,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "admin",
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
let subjectId = 0;

describe.skipIf(!enabled)("admin content feature", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email: session.user.email, role: "admin", tryoutCredits: 1 });
		const [createdSubject] = await db.insert(subject).values({ name: id, shortName: id }).returning();
		subjectId = createdSubject!.id;
	});

	afterAll(async () => {
		await db.delete(subject).where(eq(subject.id, subjectId));
		await db.delete(user).where(eq(user.id, id));
	});

	test("returns NOT_FOUND for a bad content id", async () => {
		await expect(
			call(appRouter.admin.content.update, { id: 2147483647, title: "Tidak ada" }, options),
		).rejects.toMatchObject({ code: "NOT_FOUND", message: "Konten tidak ditemukan" });
		await expect(
			call(appRouter.admin.content.listPracticeQuestions, { id: 2147483647 }, options),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	test("manages a content item and its materials", async () => {
		const content = await call(
			appRouter.admin.content.create,
			{ subjectId, title: "Konten", order: 1, note: { content: { type: "doc", content: [] } } },
			options,
		);
		expect(content.message).toBe("Konten berhasil dibuat");
		expect(content.createdMaterials.note).toBeGreaterThan(0);

		await expect(
			call(appRouter.admin.content.upsertVideo, { id: content.contentId, videoUrl: "", content: {} }, options),
		).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Video URL wajib diisi" });
		await expect(call(appRouter.admin.content.removeVideo, { id: content.contentId }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Video material tidak ditemukan",
		});

		const video = await call(
			appRouter.admin.content.upsertVideo,
			{ id: content.contentId, videoUrl: "https://youtu.be/x", content: { type: "doc", content: [] } },
			options,
		);
		expect(video).toMatchObject({ message: "Video material berhasil disimpan" });
		expect(video.videoId).toBeGreaterThan(0);

		const note = await call(
			appRouter.admin.content.upsertNote,
			{ id: content.contentId, content: { type: "doc", content: [] } },
			options,
		);
		expect(note).toMatchObject({ message: "Catatan material berhasil disimpan" });
		expect(note.noteId).toBeGreaterThan(0);

		await expect(
			call(appRouter.admin.content.listPracticeQuestions, { id: content.contentId }, options),
		).resolves.toEqual({ questions: [] });

		await expect(call(appRouter.admin.content.removeNote, { id: content.contentId }, options)).resolves.toMatchObject({
			message: "Catatan material berhasil dihapus",
		});
		await expect(call(appRouter.admin.content.removeVideo, { id: content.contentId }, options)).resolves.toMatchObject({
			message: "Video material berhasil dihapus",
		});
		await expect(
			call(appRouter.admin.content.update, { id: content.contentId, title: "Judul baru" }, options),
		).resolves.toEqual({ message: "Konten berhasil diperbarui" });
		await expect(call(appRouter.admin.content.remove, { id: content.contentId }, options)).resolves.toEqual({
			message: "Konten berhasil dihapus",
		});
	});
});
