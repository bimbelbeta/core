import { afterAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { call } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `question-type-switch-${crypto.randomUUID()}`;
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
const createdQuestionIds: number[] = [];

async function createQuestion(type: "multiple_choice" | "essay") {
	const created = await call(
		appRouter.admin.tryout.questions.create,
		{
			type,
			content: `${id} ${type}`,
			discussion: "Pembahasan",
			choices:
				type === "multiple_choice"
					? [
							{ content: "Benar", isCorrect: true },
							{ content: "Salah", isCorrect: false },
						]
					: undefined,
		},
		options,
	);
	createdQuestionIds.push(created.id);
	return created.id;
}

describe.skipIf(!enabled)("question type switch", () => {
	afterAll(async () => {
		if (createdQuestionIds.length > 0) {
			await db.delete(question).where(inArray(question.id, createdQuestionIds));
		}
	});

	test("switches between choice and essay without retaining incompatible data", async () => {
		const questionId = await createQuestion("multiple_choice");

		await call(
			appRouter.admin.tryout.questions.update,
			{
				id: questionId,
				type: "essay",
				content: `${id} essay`,
				discussion: "Pembahasan essay",
				essayCorrectAnswer: "Jawaban acuan",
			},
			options,
		);

		const [essay] = await db.select().from(question).where(eq(question.id, questionId));
		expect(essay).toMatchObject({ type: "essay", essayCorrectAnswer: "Jawaban acuan" });
		expect(await db.select().from(questionChoice).where(eq(questionChoice.questionId, questionId))).toEqual([]);

		await call(
			appRouter.admin.tryout.questions.update,
			{
				id: questionId,
				type: "multiple_choice",
				content: `${id} pilihan`,
				discussion: "Pembahasan pilihan",
				choices: [
					{ content: "Pilihan benar", isCorrect: true },
					{ content: "Pilihan salah", isCorrect: false },
				],
			},
			options,
		);

		const [multipleChoice] = await db.select().from(question).where(eq(question.id, questionId));
		expect(multipleChoice).toMatchObject({ type: "multiple_choice", essayCorrectAnswer: null });
		expect(
			(await db.select().from(questionChoice).where(eq(questionChoice.questionId, questionId))).map((choice) => [
				choice.code,
				choice.content,
				choice.isCorrect,
			]),
		).toEqual([
			["A", "Pilihan benar", true],
			["B", "Pilihan salah", false],
		]);
	});

	test("rejects an invalid type switch before changing the stored question", async () => {
		const questionId = await createQuestion("essay");

		await call(
			appRouter.admin.tryout.questions.update,
			{
				id: questionId,
				content: `${id} essay`,
				discussion: "Pembahasan essay",
				essayCorrectAnswer: "Jawaban acuan",
			},
			options,
		);

		await expect(
			call(
				appRouter.admin.tryout.questions.update,
				{
					id: questionId,
					type: "multiple_choice",
					content: `${id} pilihan tidak valid`,
					discussion: "Pembahasan pilihan",
					choices: [{ content: "Satu-satunya", isCorrect: true }],
				},
				options,
			),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Multiple choice harus memiliki minimal 2 pilihan",
		});

		const [essay] = await db.select().from(question).where(eq(question.id, questionId));
		expect(essay).toMatchObject({ type: "essay", essayCorrectAnswer: "Jawaban acuan" });
		expect(await db.select().from(questionChoice).where(eq(questionChoice.questionId, questionId))).toEqual([]);
	});
});
