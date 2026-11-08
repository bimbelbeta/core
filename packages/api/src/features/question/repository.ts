import type { DbClient } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { and, asc, count, desc, eq, gt, inArray, like, lt, sql } from "drizzle-orm";

export type QuestionRow = typeof question.$inferSelect;
export type ChoiceRow = typeof questionChoice.$inferSelect;
export type QuestionInsertData = typeof question.$inferInsert;
export type ChoiceInsertData = typeof questionChoice.$inferInsert;
export type QuestionUpdateData = Partial<QuestionRow>;
export type ChoiceUpdateData = { content?: string; isCorrect?: boolean };

export type ListQuestionsQuery = {
	limit: number;
	backward: boolean;
	cursorId?: number;
	search?: string;
	type?: QuestionRow["type"];
	tag?: string;
	category?: string;
	excludeIds?: number[];
};

export type QuestionRepository = {
	listQuestions: (query: ListQuestionsQuery) => Promise<QuestionRow[]>;
	countQuestions: () => Promise<{ total: number; essay: number }>;
	findQuestion: (id: number) => Promise<QuestionRow | undefined>;
	listChoices: (questionId: number) => Promise<ChoiceRow[]>;
	listQuestionsWithChoices: (questionIds: number[]) => Promise<{ question: QuestionRow; choices: ChoiceRow[] }[]>;
	insertQuestion: (data: QuestionInsertData) => Promise<QuestionRow | undefined>;
	insertChoices: (rows: ChoiceInsertData[]) => Promise<void>;
	insertChoice: (data: ChoiceInsertData) => Promise<ChoiceRow | undefined>;
	updateQuestion: (id: number, data: QuestionUpdateData) => Promise<QuestionRow | undefined>;
	updateChoice: (id: number, data: ChoiceUpdateData) => Promise<ChoiceRow | undefined>;
	deleteQuestion: (id: number) => Promise<QuestionRow | undefined>;
	deleteChoice: (id: number) => Promise<ChoiceRow | undefined>;
	deleteChoices: (ids: number[]) => Promise<void>;
	transaction: <T>(fn: (repository: QuestionRepository) => Promise<T>) => Promise<T>;
};

export function createQuestionRepository(client: DbClient): QuestionRepository {
	return {
		async countQuestions(): Promise<{ total: number; essay: number }> {
			const [row] = await client
				.select({
					total: count(),
					essay: count(eq(question.type, "essay")),
				})
				.from(question);
			return { total: row?.total ?? 0, essay: row?.essay ?? 0 };
		},

		async listQuestions(query: ListQuestionsQuery): Promise<QuestionRow[]> {
			return await client
				.select()
				.from(question)
				.where(
					and(
						query.cursorId !== undefined
							? query.backward
								? gt(question.id, query.cursorId)
								: lt(question.id, query.cursorId)
							: undefined,
						query.search ? like(question.content, `%${query.search}%`) : undefined,
						query.type ? eq(question.type, query.type) : undefined,
						query.tag
							? sql`EXISTS (
								SELECT 1
								FROM unnest(${question.tags}) AS tag
								WHERE tag ILIKE ${`%${query.tag}%`}
							)`
							: undefined,
						query.category ? sql`${query.category} = ANY(${question.tags})` : undefined,
						query.excludeIds && query.excludeIds.length > 0
							? sql`${question.id} NOT IN (${sql.join(
									query.excludeIds.map((id) => sql`${id}`),
									sql`, `,
								)})`
							: undefined,
					),
				)
				.orderBy(query.backward ? asc(question.id) : desc(question.id))
				.limit(query.limit + 1);
		},

		async findQuestion(id: number): Promise<QuestionRow | undefined> {
			const [row] = await client.select().from(question).where(eq(question.id, id)).limit(1);
			return row;
		},

		async listChoices(questionId: number): Promise<ChoiceRow[]> {
			return await client
				.select()
				.from(questionChoice)
				.where(eq(questionChoice.questionId, questionId))
				.orderBy(questionChoice.code);
		},

		async listQuestionsWithChoices(questionIds: number[]): Promise<{ question: QuestionRow; choices: ChoiceRow[] }[]> {
			if (questionIds.length === 0) return [];

			const rows = await client
				.select({ question, choice: questionChoice })
				.from(question)
				.leftJoin(questionChoice, eq(questionChoice.questionId, question.id))
				.where(inArray(question.id, questionIds))
				.orderBy(question.id, questionChoice.code);

			const byId = new Map<number, { question: QuestionRow; choices: ChoiceRow[] }>();
			for (const row of rows) {
				const entry = byId.get(row.question.id) ?? { question: row.question, choices: [] };
				if (row.choice) entry.choices.push(row.choice);
				byId.set(row.question.id, entry);
			}

			return [...byId.values()];
		},

		async insertQuestion(data: QuestionInsertData): Promise<QuestionRow | undefined> {
			const [row] = await client.insert(question).values(data).returning();
			return row;
		},

		async insertChoices(rows: ChoiceInsertData[]): Promise<void> {
			await client.insert(questionChoice).values(rows);
		},

		async insertChoice(data: ChoiceInsertData): Promise<ChoiceRow | undefined> {
			const [row] = await client.insert(questionChoice).values(data).returning();
			return row;
		},

		async updateQuestion(id: number, data: QuestionUpdateData): Promise<QuestionRow | undefined> {
			const [row] = await client.update(question).set(data).where(eq(question.id, id)).returning();
			return row;
		},

		async updateChoice(id: number, data: ChoiceUpdateData): Promise<ChoiceRow | undefined> {
			const [row] = await client.update(questionChoice).set(data).where(eq(questionChoice.id, id)).returning();
			return row;
		},

		async deleteQuestion(id: number): Promise<QuestionRow | undefined> {
			const [row] = await client.delete(question).where(eq(question.id, id)).returning();
			return row;
		},

		async deleteChoice(id: number): Promise<ChoiceRow | undefined> {
			const [row] = await client.delete(questionChoice).where(eq(questionChoice.id, id)).returning();
			return row;
		},

		async deleteChoices(ids: number[]): Promise<void> {
			await client.delete(questionChoice).where(inArray(questionChoice.id, ids));
		},

		async transaction<T>(fn: (repository: QuestionRepository) => Promise<T>): Promise<T> {
			return await client.transaction((tx) => fn(createQuestionRepository(tx)));
		},
	};
}
