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

export type QuestionImageRow = {
    url: string;
    questionId: number;
    questionPreview: string;
    createdAt: Date | null;
};

export type ListImagesQuery = {
    limit: number;
    backward: boolean;
    cursorId?: string;
    search?: string;
};

export type QuestionRepository = {
    listImages: (query: ListImagesQuery) => Promise<QuestionImageRow[]>;
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
                    essay: sql<number>`count(*) filter (where ${question.type} = 'essay')`.mapWith(Number),
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

        async listImages(query: ListImagesQuery): Promise<QuestionImageRow[]> {
            const search = query.search?.replace(/[!%_]/g, "!$&");
            const searchCondition = search
                ? sql`(gallery.url ILIKE ${`%${search}%`} ESCAPE '!' OR gallery.preview ILIKE ${`%${search}%`} ESCAPE '!')`
                : undefined;
            const cursorCondition = query.cursorId === undefined
                ? undefined
                : query.backward
                    ? sql`gallery.url COLLATE "C" > ${query.cursorId}`
                    : sql`gallery.url COLLATE "C" < ${query.cursorId}`;

            // Traverse rich-text nodes, not arbitrary strings or links. Deduplicate
            // by URL before applying the cursor. The largest question ID owns metadata.
            const gallery = sql`(
                WITH RECURSIVE question_rows AS (
                    SELECT ${question.id} AS question_id,
                        ${question.contentJson}::jsonb AS content_json,
                        ${question.discussionJson}::jsonb AS discussion_json,
                        ${question.content} AS legacy_content,
                        ${question.createdAt} AS created_at
                    FROM ${question}
                ), nodes(question_id, is_content, node, path) AS (
                    SELECT q.question_id, root.is_content, root.node, ARRAY[]::bigint[]
                    FROM question_rows AS q
                    CROSS JOIN LATERAL (VALUES
                        (true, q.content_json), (false, q.discussion_json)
                    ) AS root(is_content, node)
                    WHERE jsonb_typeof(root.node) = 'object'
                    UNION ALL
                    SELECT n.question_id, n.is_content, child.node, n.path || child.position
                    FROM nodes AS n
                    CROSS JOIN LATERAL jsonb_array_elements(
                        CASE WHEN jsonb_typeof(n.node -> 'content') = 'array'
                            THEN n.node -> 'content' ELSE '[]'::jsonb END
                    ) WITH ORDINALITY AS child(node, position)
                ), image_refs AS (
                    SELECT question_id, node -> 'attrs' ->> 'src' AS url
                    FROM nodes
                    WHERE node ->> 'type' = 'image'
                        AND jsonb_typeof(node -> 'attrs' -> 'src') = 'string'
                        AND btrim(node -> 'attrs' ->> 'src') <> ''
                ), unique_images AS (
                    SELECT DISTINCT ON (url COLLATE "C") url, question_id
                    FROM image_refs
                    ORDER BY url COLLATE "C", question_id DESC
                ), previews AS (
                    SELECT question_id, string_agg(node ->> 'text', ' ' ORDER BY path) AS preview
                    FROM nodes
                    WHERE is_content AND node ->> 'type' = 'text'
                        AND jsonb_typeof(node -> 'text') = 'string'
                    GROUP BY question_id
                )
                SELECT i.url, q.question_id, q.created_at,
                    COALESCE(p.preview, CASE WHEN q.content_json IS NULL
                        OR q.content_json = 'null'::jsonb THEN q.legacy_content ELSE '' END, '') AS preview
                FROM unique_images AS i
                JOIN question_rows AS q ON q.question_id = i.question_id
                LEFT JOIN previews AS p ON p.question_id = q.question_id
            ) AS gallery`;

            return await client
                .select({
                    url: sql<string>`gallery.url`,
                    questionId: sql<number>`gallery.question_id`.mapWith(Number),
                    questionPreview: sql<string>`left(gallery.preview, 160)`,
                    createdAt: sql<Date | null>`(extract(epoch FROM gallery.created_at) * 1000)::double precision`.mapWith({
                        mapFromDriverValue: (value: unknown): Date | null =>
                            value == null ? null : new Date(Number(value)),
                    }),
                })
                .from(gallery)
                .where(and(searchCondition, cursorCondition))
                .orderBy(query.backward ? sql`gallery.url COLLATE "C" ASC` : sql`gallery.url COLLATE "C" DESC`)
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
