import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { contentItem, contentPracticeQuestions, subject } from "@bimbelbeta/db/schema/subject";
import { call } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `subject-integration-${crypto.randomUUID()}`;
const now = new Date();

function makeSession(role: Session["user"]["role"], isPremium: boolean): Session {
	return {
		user: {
			id,
			name: id,
			email: `${id}@example.com`,
			emailVerified: false,
			image: null,
			createdAt: now,
			updatedAt: now,
			role,
			isPremium,
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
	};
}

const adminOptions = { context: { session: makeSession("admin", false) } };
const memberOptions = { context: { session: makeSession("user", false) } };
const premiumOptions = { context: { session: makeSession("user", true) } };
const MISSING_ID = 2147483647;

let subjectId = 0;
let contentId = 0;
const createdQuestionIds: number[] = [];

describe.skipIf(!enabled)("subject feature", () => {
	beforeAll(async () => {
		await db.insert(user).values({ id, name: id, email: `${id}@example.com`, role: "user", tryoutCredits: 1 });
	});

	afterAll(async () => {
		if (subjectId) await db.delete(subject).where(eq(subject.id, subjectId));
		if (createdQuestionIds.length > 0) {
			await db.delete(question).where(inArray(question.id, createdQuestionIds));
		}
		await db.delete(user).where(eq(user.id, id));
	});

	test("admin writes reach the member surface through one repository", async () => {
		const created = await call(
			appRouter.admin.subject.create,
			{ name: id, shortName: id, order: 90, category: "smp", gradeLevel: 7 },
			adminOptions,
		);
		expect(created.message).toBe("Kelas berhasil dibuat");
		subjectId = created.id;

		const listedContent = await call(appRouter.subject.listContent, { subjectId }, memberOptions);
		expect(listedContent.subject).toEqual({
			id: subjectId,
			name: id,
			shortName: id,
			description: null,
			order: 90,
			category: "smp",
			gradeLevel: 7,
		});
		expect(listedContent.items).toEqual([]);

		await call(appRouter.admin.subject.update, { id: subjectId, name: `${id} v2` }, adminOptions);

		const listed = await call(appRouter.subject.list, { search: id }, memberOptions);
		expect(listed.items).toEqual([
			{
				id: subjectId,
				name: `${id} v2`,
				shortName: id,
				description: null,
				order: 90,
				category: "smp",
				gradeLevel: 7,
				totalContent: 0,
				hasViewed: false,
			},
		]);
	});

	test("still returns NOT_FOUND for a bad subject id", async () => {
		await expect(call(appRouter.subject.listContent, { subjectId: MISSING_ID }, memberOptions)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subject tidak ditemukan",
		});
		await expect(
			call(appRouter.subject.trackSubjectView, { subjectId: MISSING_ID }, memberOptions),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subject tidak ditemukan",
		});
		await expect(
			call(appRouter.admin.subject.update, { id: MISSING_ID, name: "Tidak ada" }, adminOptions),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Kelas tidak ditemukan",
		});
		await expect(call(appRouter.admin.subject.remove, { id: MISSING_ID }, adminOptions)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Kelas tidak ditemukan",
		});
		await expect(
			call(appRouter.admin.subject.create, { name: id, shortName: id, category: "utbk", gradeLevel: 10 }, adminOptions),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "UTBK tidak boleh memiliki gradeLevel",
		});
	});

	test("locks content behind premium and serves it with its practice questions", async () => {
		const [createdContent] = await db
			.insert(contentItem)
			.values({ subjectId, title: `${id} materi`, order: 1 })
			.returning();
		contentId = createdContent!.id;

		await expect(call(appRouter.subject.findContent, { contentId }, memberOptions)).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Konten ini memerlukan akun premium",
		});

		const found = await call(appRouter.subject.findContent, { contentId }, premiumOptions);
		expect(found).toMatchObject({
			id: contentId,
			title: `${id} materi`,
			order: 1,
			subjectId,
			video: null,
			note: null,
			practiceQuestions: null,
		});

		const [createdQuestion] = await db
			.insert(question)
			.values({ type: "multiple_choice", content: `${id} soal`, discussion: "Pembahasan" })
			.returning();
		createdQuestionIds.push(createdQuestion!.id);
		await db.insert(questionChoice).values({
			questionId: createdQuestion!.id,
			code: "A",
			content: "Pilihan",
			isCorrect: true,
		});
		await db.insert(contentPracticeQuestions).values({
			contentItemId: contentId,
			questionId: createdQuestion!.id,
			order: 1,
		});

		const withQuestions = await call(appRouter.subject.findContent, { contentId }, premiumOptions);
		expect(withQuestions.practiceQuestions?.questions).toEqual([
			{
				questionId: createdQuestion!.id,
				order: 1,
				question: {
					type: "doc",
					content: [{ type: "paragraph", content: [{ type: "text", text: `${id} soal` }] }],
				},
				discussion: {
					type: "doc",
					content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan" }] }],
				},
				type: "multiple_choice",
				essayCorrectAnswer: null,
				answers: [{ id: expect.any(Number), content: "Pilihan", code: "A", isCorrect: true }],
			},
		]);

		expect(await call(appRouter.subject.trackView, { contentId }, memberOptions)).toEqual({
			message: "Berhasil mencatat aktivitas",
		});
		const recentViews = await call(appRouter.subject.listRecentViews, undefined, memberOptions);
		expect(recentViews).toEqual([
			{
				viewedAt: expect.any(Date),
				contentId,
				contentTitle: `${id} materi`,
				subjectId,
				subjectName: `${id} v2`,
				subjectShortName: id,
				hasVideo: false,
				hasNote: false,
				hasPracticeQuestions: true,
			},
		]);

		await call(appRouter.subject.updateProgress, { contentId, videoCompleted: true }, memberOptions);
		expect(await call(appRouter.subject.stats, undefined, memberOptions)).toEqual({ materialsCompleted: 1 });

		await call(appRouter.subject.trackSubjectView, { subjectId }, memberOptions);
		const listed = await call(appRouter.subject.list, { search: id }, memberOptions);
		expect(listed.items[0]).toMatchObject({
			id: subjectId,
			totalContent: 1,
			hasViewed: true,
		});

		await call(appRouter.admin.subject.remove, { id: subjectId }, adminOptions);
		expect(await db.select().from(subject).where(eq(subject.id, subjectId))).toHaveLength(0);
		expect(await db.select().from(contentItem).where(eq(contentItem.id, contentId))).toHaveLength(0);
	});
});
