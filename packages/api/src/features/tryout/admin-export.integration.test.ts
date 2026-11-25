import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	tryout,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { call } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `admin-export-${crypto.randomUUID()}`;
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
		tryoutCredits: 0,
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
const participantIds = [`${id}-first`, `${id}-second`];
const questionIds: number[] = [];
let tryoutId = 0;
let universityId = 0;
let studyProgramId = 0;

describe.skipIf(!enabled)("admin tryout attempt export", () => {
	beforeAll(async () => {
		const [targetUniversity] = await db
			.insert(university)
			.values({ name: `${id} University`, slug: `${id}-university` })
			.returning();
		const [targetStudyProgram] = await db
			.insert(studyProgram)
			.values({ name: `${id} Program`, slug: `${id}-program` })
			.returning();
		universityId = targetUniversity!.id;
		studyProgramId = targetStudyProgram!.id;
		await db.insert(universityStudyProgram).values({ universityId, studyProgramId });
		await db.insert(user).values([
			{
				id: participantIds[0]!,
				name: `${id} First`,
				email: `${id}-first@example.com`,
				targetUniversityId: universityId,
				targetStudyProgramId: studyProgramId,
			},
			{ id: participantIds[1]!, name: `${id} Second`, email: `${id}-second@example.com` },
		]);

		const [createdTryout] = await db
			.insert(tryout)
			.values({ title: `${id} Tryout`, category: "utbk", status: "published" })
			.returning();
		tryoutId = createdTryout!.id;
		const [firstSubtest, secondSubtest] = await db
			.insert(tryoutSubtest)
			.values([
				{ tryoutId, name: "Penalaran", duration: 30, order: 1 },
				{ tryoutId, name: "Literasi", duration: 30, order: 2 },
			])
			.returning();
		const [multipleChoice, complexChoice, essay] = await db
			.insert(question)
			.values([
				{ type: "multiple_choice", content: `${id} choice`, discussion: "Pembahasan" },
				{ type: "multiple_choice_complex", content: `${id} complex`, discussion: "Pembahasan" },
				{
					type: "essay",
					content: `${id} essay`,
					discussion: "Pembahasan",
					essayCorrectAnswer: "Jawaban Acuan",
				},
			])
			.returning();
		questionIds.push(multipleChoice!.id, complexChoice!.id, essay!.id);
		const [choiceCorrect, choiceWrong, complexCorrectOne, complexCorrectTwo, complexWrong] = await db
			.insert(questionChoice)
			.values([
				{ questionId: multipleChoice!.id, code: "A", content: "Benar", isCorrect: true },
				{ questionId: multipleChoice!.id, code: "B", content: "Salah", isCorrect: false },
				{ questionId: complexChoice!.id, code: "A", content: "Benar 1", isCorrect: true },
				{ questionId: complexChoice!.id, code: "B", content: "Benar 2", isCorrect: true },
				{ questionId: complexChoice!.id, code: "C", content: "Salah", isCorrect: false },
			])
			.returning();
		await db.insert(tryoutSubtestQuestion).values([
			{ subtestId: firstSubtest!.id, questionId: multipleChoice!.id, order: 1 },
			{ subtestId: firstSubtest!.id, questionId: complexChoice!.id, order: 2 },
			{ subtestId: secondSubtest!.id, questionId: essay!.id, order: 1 },
		]);

		const deadline = new Date("2100-01-01");
		const [firstAttempt, secondAttempt, retake] = await db
			.insert(tryoutAttempt)
			.values([
				{
					userId: participantIds[0]!,
					tryoutId,
					deadline,
					completedAt: now,
					status: "finished",
					score: "800",
				},
				{
					userId: participantIds[1]!,
					tryoutId,
					deadline,
					completedAt: now,
					status: "finished",
					score: "600",
				},
				{
					userId: participantIds[0]!,
					tryoutId,
					attemptNumber: 2,
					deadline,
					completedAt: now,
					status: "finished",
					score: "999",
				},
			])
			.returning();
		await db.insert(tryoutSubtestAttempt).values([
			{
				tryoutAttemptId: firstAttempt!.id,
				subtestId: firstSubtest!.id,
				deadline,
				completedAt: now,
				status: "finished",
				score: "700",
			},
			{
				tryoutAttemptId: firstAttempt!.id,
				subtestId: secondSubtest!.id,
				deadline,
				completedAt: now,
				status: "finished",
				score: "900",
			},
			{
				tryoutAttemptId: secondAttempt!.id,
				subtestId: firstSubtest!.id,
				deadline,
				completedAt: now,
				status: "finished",
				score: "600",
			},
			{
				tryoutAttemptId: retake!.id,
				subtestId: firstSubtest!.id,
				deadline,
				completedAt: now,
				status: "finished",
				score: "999",
			},
		]);
		await db.insert(tryoutUserAnswer).values([
			{ attemptId: firstAttempt!.id, questionId: multipleChoice!.id, selectedChoiceId: choiceCorrect!.id },
			{
				attemptId: firstAttempt!.id,
				questionId: complexChoice!.id,
				selectedChoiceIds: [complexCorrectOne!.id, complexCorrectTwo!.id],
			},
			{ attemptId: firstAttempt!.id, questionId: essay!.id, essayAnswer: " jawaban acuan " },
			{ attemptId: secondAttempt!.id, questionId: multipleChoice!.id, selectedChoiceId: choiceWrong!.id },
			{
				attemptId: retake!.id,
				questionId: complexChoice!.id,
				selectedChoiceIds: [complexCorrectOne!.id, complexWrong!.id],
			},
		]);
	});

	afterAll(async () => {
		if (tryoutId) await db.delete(tryout).where(eq(tryout.id, tryoutId));
		if (questionIds.length > 0) await db.delete(question).where(inArray(question.id, questionIds));
		await db.delete(user).where(inArray(user.id, participantIds));
		if (universityId) await db.delete(university).where(eq(university.id, universityId));
		if (studyProgramId) await db.delete(studyProgram).where(eq(studyProgram.id, studyProgramId));
	});

	test("exports relational attempt data, scores, and official ranks without retakes", async () => {
		const result = await call(appRouter.admin.tryout.attempts.export, { id: tryoutId }, options);

		expect(result.tryout).toEqual({ id: tryoutId, title: `${id} Tryout`, category: "utbk" });
		expect(result.subtests.map((subtest) => [subtest.name, subtest.order])).toEqual([
			["Penalaran", 1],
			["Literasi", 2],
		]);
		expect(result.rows).toHaveLength(2);
		expect(result.rows[0]).toMatchObject({
			attemptNumber: 1,
			rank: 1,
			userId: participantIds[0],
			targetUniversityName: `${id} University`,
			targetStudyProgramName: `${id} Program`,
			totalScore: 800,
			subtestScores: [
				{ score: 700, correctCount: 2, questionCount: 2 },
				{ score: 900, correctCount: 1, questionCount: 1 },
			],
		});
		expect(result.rows[1]).toMatchObject({
			attemptNumber: 1,
			rank: 2,
			userId: participantIds[1],
			targetUniversityName: null,
			targetStudyProgramName: null,
			totalScore: 600,
			subtestScores: [{ score: 600, correctCount: 0, questionCount: 2 }],
		});
	});

	test("includes retakes only when requested without assigning them an official rank", async () => {
		const result = await call(appRouter.admin.tryout.attempts.export, { id: tryoutId, includeRetakes: true }, options);

		expect(result.rows).toHaveLength(3);
		expect(result.rows[2]).toMatchObject({
			attemptNumber: 2,
			rank: null,
			totalScore: 999,
			subtestScores: [{ score: 999, correctCount: 0, questionCount: 2 }],
		});
	});

	test("rejects an export for a missing tryout", async () => {
		await expect(call(appRouter.admin.tryout.attempts.export, { id: 2147483647 }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan",
		});
	});
});
