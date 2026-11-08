import { afterAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { call } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `question-integration-${crypto.randomUUID()}`;
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
const MISSING_ID = 2147483647;

async function entryChoiceIds(questionId: number) {
	const rows = await db.select().from(questionChoice).where(eq(questionChoice.questionId, questionId));
	return rows.map((row) => ({ id: row.id, code: row.code }));
}

async function createQuestion(type: "multiple_choice" | "multiple_choice_complex" | "essay", choiceCount = 0) {
	const created = await call(
		appRouter.admin.tryout.questions.create,
		{
			type,
			content: `${id} ${type}`,
			discussion: "Pembahasan",
			choices:
				type === "essay"
					? undefined
					: Array.from({ length: choiceCount }, (_, index) => ({
							content: `Pilihan ${index + 1}`,
							isCorrect: index === 0,
						})),
		},
		options,
	);
	createdQuestionIds.push(created.id);
	return created;
}

describe.skipIf(!enabled)("admin question feature", () => {
	afterAll(async () => {
		if (createdQuestionIds.length > 0) {
			await db.delete(question).where(inArray(question.id, createdQuestionIds));
		}
	});

	test("creates a question and manages its choices through every admin handler", async () => {
		const created = await createQuestion("multiple_choice", 2);
		expect(created.message).toBe("Question berhasil dibuat");

		const initialChoices = await entryChoiceIds(created.id);
		expect(initialChoices.map((choice) => choice.code).sort()).toEqual(["A", "B"]);

		const listed = await call(appRouter.admin.tryout.questions.list, { search: id }, options);
		const listedQuestion = listed.items.find((item) => item.id === created.id);
		expect(listedQuestion?.content).toEqual({
			type: "doc",
			content: [{ type: "paragraph", content: [{ type: "text", text: `${id} multiple_choice` }] }],
		});
		expect(listedQuestion?.type).toBe("multiple_choice");

		await call(
			appRouter.admin.tryout.questions.update,
			{
				id: created.id,
				content: `${id} diperbarui`,
				discussion: "Pembahasan baru",
				choices: [
					{ id: initialChoices[0]!.id, content: "Diperbarui", isCorrect: false },
					{ content: "Brokol", isCorrect: false },
				],
			},
			options,
		);
		const [updatedRow] = await db.select().from(question).where(eq(question.id, created.id));
		expect(updatedRow!.content).toBe(`${id} diperbarui`);
		expect(
			(await db.select().from(questionChoice).where(eq(questionChoice.questionId, created.id))).map((row) => [
				row.code,
				row.content,
				row.isCorrect,
			]),
		).toEqual([
			["A", "Diperbarui", false],
			["B", "Brokol", false],
		]);

		const newChoice = await call(
			appRouter.admin.tryout.questions.createChoice,
			{ questionId: created.id, content: "Wortel", isCorrect: true },
			options,
		);
		expect(newChoice.message).toBe("Choice berhasil dibuat");
		const [codedRow] = await db.select().from(questionChoice).where(eq(questionChoice.id, newChoice.id));
		expect(codedRow!.code).toBe("C");

		await call(
			appRouter.admin.tryout.questions.updateChoice,
			{ id: newChoice.id, content: "Wortel besar", isCorrect: false },
			options,
		);
		const [updatedChoiceRow] = await db.select().from(questionChoice).where(eq(questionChoice.id, newChoice.id));
		expect(updatedChoiceRow!.content).toBe("Wortel besar");
		expect(updatedChoiceRow!.isCorrect).toBe(false);

		const found = await call(appRouter.admin.tryout.questions.find, { id: created.id }, options);
		expect(found.question).toMatchObject({
			id: created.id,
			type: "multiple_choice",
			essayCorrectAnswer: null,
		});
		expect(found.question.content).toEqual({
			type: "doc",
			content: [{ type: "paragraph", content: [{ type: "text", text: `${id} diperbarui` }] }],
		});
		expect(found.choices.map((choice) => choice.code)).toEqual(["A", "B", "C"]);

		await call(appRouter.admin.tryout.questions.removeChoice, { id: newChoice.id }, options);
		expect(await db.select().from(questionChoice).where(eq(questionChoice.id, newChoice.id))).toHaveLength(0);

		await call(appRouter.admin.tryout.questions.remove, { id: created.id }, options);
		expect(await db.select().from(question).where(eq(question.id, created.id))).toHaveLength(0);
	});

	test("still returns NOT_FOUND for a bad question or choice id", async () => {
		await expect(call(appRouter.admin.tryout.questions.find, { id: MISSING_ID }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Question tidak ditemukan",
		});
		await expect(
			call(
				appRouter.admin.tryout.questions.update,
				{ id: MISSING_ID, content: "Soal", discussion: "Pembahasan" },
				options,
			),
		).rejects.toMatchObject({ code: "NOT_FOUND", message: "Question tidak ditemukan" });
		await expect(call(appRouter.admin.tryout.questions.remove, { id: MISSING_ID }, options)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Question tidak ditemukan",
		});
		await expect(
			call(appRouter.admin.tryout.questions.updateChoice, { id: MISSING_ID, content: "Pilihan" }, options),
		).rejects.toMatchObject({ code: "NOT_FOUND", message: "Choice tidak ditemukan" });
		await expect(
			call(appRouter.admin.tryout.questions.removeChoice, { id: MISSING_ID }, options),
		).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Choice tidak ditemukan",
		});
	});

	test("translates the validation rules to BAD_REQUEST", async () => {
		await expect(
			call(
				appRouter.admin.tryout.questions.create,
				{
					type: "multiple_choice",
					content: "Soal",
					discussion: "Pembahasan",
					choices: [{ content: "Satu-satunya", isCorrect: true }],
				},
				options,
			),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Multiple choice harus memiliki minimal 2 pilihan",
		});
		expect(await db.select().from(question).where(eq(question.content, "Soal"))).toHaveLength(0);

		const created = await createQuestion("multiple_choice_complex", 2);
		for (let index = 0; index < 5; index += 1) {
			const added = await call(
				appRouter.admin.tryout.questions.createChoice,
				{ questionId: created.id, content: `Pilihan tambahan ${index}`, isCorrect: false },
				options,
			);
			expect(await entryChoiceIds(created.id)).toHaveLength(3 + index);
			expect(added.message).toBe("Choice berhasil dibuat");
		}

		await expect(
			call(
				appRouter.admin.tryout.questions.createChoice,
				{ questionId: created.id, content: "Kelebihan", isCorrect: false },
				options,
			),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Maksimal pilihan tercapai (7 pilihan)",
		});
		expect(await entryChoiceIds(created.id)).toHaveLength(7);
	});
});
