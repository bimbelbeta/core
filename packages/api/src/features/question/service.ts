import { db } from "@bimbelbeta/db";
import { normalizeQuestionContent, readTiptapContent } from "@/lib/content-utils";
import { DomainError } from "@/lib/domain-error";
import { buildIdCursorPage, buildStringIdCursorPage, createStringIdCursor, decodeIdPage, decodeStringIdPage } from "@/lib/pagination/cursor";
import { type ChoiceRow, createQuestionRepository, type QuestionRepository, type QuestionRow } from "./repository";
const CHOICE_CODES = ["A", "B", "C", "D", "E", "F", "G"] as const;
type ListQuestionsInput = {
    limit?: number;
    before?: string;
    after?: string;
    search?: string;
    type?: QuestionRow["type"];
    tag?: string;
    category?: string;
    excludeIds?: number[];
};
type CreateQuestionInput = {
    type: QuestionRow["type"];
    content: unknown;
    discussion: unknown;
    tags?: string[];
    essayCorrectAnswer?: string;
    choices?: {
        content: string;
        isCorrect: boolean;
    }[];
};
type QuestionValidation = {
    status: "too_few_choices";
} | {
    status: "too_many_choices";
} | {
    status: "incorrect_choice_count";
} | {
    status: "too_few_complex_choices";
} | {
    status: "essay_has_choices";
};
const QUESTION_VALIDATION_MESSAGES: Record<QuestionValidation["status"], string> = {
    too_few_choices: "Multiple choice harus memiliki minimal 2 pilihan",
    too_many_choices: "Maksimal 7 pilihan jawaban",
    incorrect_choice_count: "Multiple choice harus memiliki tepat 1 pilihan yang benar",
    too_few_complex_choices: "Pilihan majemuk kompleks harus memiliki minimal 2 pilihan",
    essay_has_choices: "Soal essay tidak boleh memiliki pilihan jawaban",
};
function validateQuestion(input: {
    type: QuestionRow["type"];
    choices?: {
        isCorrect: boolean;
    }[];
}): QuestionValidation | null {
    const { choices } = input;
    if (input.type === "multiple_choice") {
        if (!choices || choices.length < 2)
            return { status: "too_few_choices" };
        if (choices.length > CHOICE_CODES.length)
            return { status: "too_many_choices" };
        if (choices.filter((choice) => choice.isCorrect).length !== 1) {
            return { status: "incorrect_choice_count" };
        }
    }
    if (input.type === "multiple_choice_complex" && (!choices || choices.length < 2)) {
        return { status: "too_few_complex_choices" };
    }
    if (input.type === "multiple_choice_complex" && choices && choices.length > CHOICE_CODES.length) {
        return { status: "too_many_choices" };
    }
    if (input.type === "essay" && choices && choices.length > 0)
        return { status: "essay_has_choices" };
    return null;
}
type UpdateQuestionInput = {
    id: number;
    type?: QuestionRow["type"];
    content: unknown;
    discussion: unknown;
    tags?: string[];
    essayCorrectAnswer?: string | null;
    choices?: {
        id?: number;
        content: string;
        isCorrect: boolean;
    }[];
};
async function reconcileChoices(repo: QuestionRepository, questionId: number, choices: {
    id?: number;
    content: string;
    isCorrect: boolean;
}[], existingChoices: ChoiceRow[]) {
    const incomingIds = new Set(choices.flatMap((choice) => (choice.id !== undefined && choice.id > 0 ? [choice.id] : [])));
    const toDelete = existingChoices.filter((choice) => !incomingIds.has(choice.id)).map((choice) => choice.id);
    if (toDelete.length > 0)
        await repo.deleteChoices(toDelete);
    const usedCodes = new Set(existingChoices.filter((choice) => incomingIds.has(choice.id)).map((choice) => choice.code));
    for (const choice of choices) {
        if (choice.id !== undefined && choice.id > 0) {
            const existing = existingChoices.find((item) => item.id === choice.id);
            if (existing && (existing.content !== choice.content || existing.isCorrect !== choice.isCorrect)) {
                await repo.updateChoice(choice.id, { content: choice.content, isCorrect: choice.isCorrect });
            }
            continue;
        }
        const nextCode = CHOICE_CODES.find((code) => !usedCodes.has(code));
        if (nextCode) {
            usedCodes.add(nextCode);
            await repo.insertChoice({
                questionId,
                code: nextCode,
                content: choice.content,
                isCorrect: choice.isCorrect,
            });
        }
    }
}
function hasInvalidChoiceIds(choices: {
    id?: number;
    content: string;
    isCorrect: boolean;
}[], existingChoices: ChoiceRow[]) {
    const existingIds = new Set(existingChoices.map((choice) => choice.id));
    const receivedIds = new Set<number>();
    return choices.some((choice) => {
        if (choice.id === undefined || choice.id <= 0)
            return false;
        if (receivedIds.has(choice.id) || !existingIds.has(choice.id))
            return true;
        receivedIds.add(choice.id);
        return false;
    });
}
export function createQuestionService({ repository }: {
    repository: QuestionRepository;
}) {
    return {
        async create(input: CreateQuestionInput) {
            const invalid = validateQuestion(input);
            if (invalid)
                throw new DomainError("BAD_REQUEST", QUESTION_VALIDATION_MESSAGES[invalid.status]);
            const content = normalizeQuestionContent(input);
            return await repository.transaction(async (repo) => {
                const created = await repo.insertQuestion({
                    type: input.type,
                    content: content.contentText,
                    contentJson: content.contentJson,
                    discussion: content.discussionText,
                    discussionJson: content.discussionJson,
                    tags: input.tags ?? [],
                    essayCorrectAnswer: input.essayCorrectAnswer,
                });
                if (!created)
                    throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat question");
                if ((input.type === "multiple_choice" || input.type === "multiple_choice_complex") && input.choices) {
                    await repo.insertChoices(input.choices.map((choice, index) => ({
                        questionId: created.id,
                        code: CHOICE_CODES[index] || "A",
                        content: choice.content,
                        isCorrect: choice.isCorrect,
                    })));
                }
                return { id: created.id };
            });
        },
        async list(input: ListQuestionsInput) {
            const { limit, backward: isBackward, cursorId, hasCursor } = decodeIdPage(input, 10);
            const rows = await repository.listQuestions({
                limit,
                backward: isBackward,
                cursorId,
                search: input.search,
                type: input.type,
                tag: input.tag,
                category: input.category,
                excludeIds: input.excludeIds,
            });
            const { items, pageInfo } = buildIdCursorPage(rows, limit, isBackward, hasCursor);
            return {
                items: items.map((row) => ({
                    ...row,
                    content: readTiptapContent(row.contentJson, row.content),
                    discussion: readTiptapContent(row.discussionJson, row.discussion),
                })),
                pageInfo,
            };
        },
        async update(input: UpdateQuestionInput) {
            const content = normalizeQuestionContent(input);
            await repository.transaction(async (repo) => {
                const existing = await repo.findQuestion(input.id);
                if (!existing)
                    throw new DomainError("NOT_FOUND", "Question tidak ditemukan");
                const type = input.type ?? existing.type;
                const isTypeChange = type !== existing.type;
                const essayCorrectAnswer = type === "essay"
                    ? input.essayCorrectAnswer === undefined
                        ? isTypeChange
                            ? null
                            : existing.essayCorrectAnswer
                        : input.essayCorrectAnswer
                    : null;
                if (input.choices !== undefined || isTypeChange) {
                    const invalid = validateQuestion({ type, choices: input.choices });
                    if (invalid)
                        throw new DomainError("BAD_REQUEST", QUESTION_VALIDATION_MESSAGES[invalid.status]);
                }
                const existingChoices = type === "essay" || input.choices !== undefined ? await repo.listChoices(input.id) : [];
                if (input.choices && hasInvalidChoiceIds(input.choices, existingChoices)) {
                    throw new DomainError("BAD_REQUEST", "Pilihan jawaban tidak sesuai dengan soal");
                }
                const updated = await repo.updateQuestion(input.id, {
                    type,
                    content: content.contentText,
                    contentJson: content.contentJson,
                    discussion: content.discussionText,
                    discussionJson: content.discussionJson,
                    essayCorrectAnswer,
                    tags: input.tags ?? [],
                });
                if (!updated)
                    throw new DomainError("NOT_FOUND", "Question tidak ditemukan");
                if (type === "essay") {
                    if (existingChoices.length > 0)
                        await repo.deleteChoices(existingChoices.map((choice) => choice.id));
                    return;
                }
                if (input.choices !== undefined) {
                    await reconcileChoices(repo, input.id, input.choices, existingChoices);
                }
            });
        },
        async remove(input: {
            id: number;
        }) {
            const removed = await repository.deleteQuestion(input.id);
            if (!removed)
                throw new DomainError("NOT_FOUND", "Question tidak ditemukan");
        },
        async listImages(input: {
            limit?: number;
            after?: string;
            before?: string;
            search?: string;
        }) {
            if (input.limit !== undefined && (!Number.isSafeInteger(input.limit) || input.limit < 1)) {
                throw new DomainError("BAD_REQUEST", "Batas jumlah gambar harus berupa bilangan bulat positif");
            }
            if (input.after !== undefined && input.before !== undefined) {
                throw new DomainError("BAD_REQUEST", "Kursor sebelum dan sesudah tidak boleh digunakan bersamaan");
            }
            const { limit, backward, cursorId, hasCursor } = decodeStringIdPage(input, 10);
            const cursor = input.after ?? input.before;
            if (cursor !== undefined && (!cursorId || cursorId.includes("\0") || createStringIdCursor(cursorId) !== cursor)) {
                throw new DomainError("BAD_REQUEST", "Kursor tidak valid");
            }
            const rows = await repository.listImages({ limit, backward, cursorId, search: input.search?.trim() });
            return buildStringIdCursorPage(rows, limit, backward, hasCursor, "url");
        },
        async createChoice(input: {
            questionId: number;
            content: string;
            isCorrect: boolean;
        }) {
            const usedCodes = (await repository.listChoices(input.questionId)).map((choice) => choice.code);
            const nextCode = CHOICE_CODES.find((code) => !usedCodes.includes(code));
            if (!nextCode)
                throw new DomainError("BAD_REQUEST", "Maksimal pilihan tercapai (7 pilihan)");
            const created = await repository.insertChoice({
                questionId: input.questionId,
                code: nextCode,
                content: input.content,
                isCorrect: input.isCorrect,
            });
            if (!created)
                throw new DomainError("INTERNAL_SERVER_ERROR", "Gagal membuat choice");
            return { id: created.id };
        },
        async updateChoice(input: {
            id: number;
            content?: string;
            isCorrect?: boolean;
        }) {
            const updateData: {
                content?: string;
                isCorrect?: boolean;
            } = {};
            if (input.content !== undefined)
                updateData.content = input.content;
            if (input.isCorrect !== undefined)
                updateData.isCorrect = input.isCorrect;
            const updated = await repository.updateChoice(input.id, updateData);
            if (!updated)
                throw new DomainError("NOT_FOUND", "Choice tidak ditemukan");
        },
        async removeChoice(input: {
            id: number;
        }) {
            const removed = await repository.deleteChoice(input.id);
            if (!removed)
                throw new DomainError("NOT_FOUND", "Choice tidak ditemukan");
        },
        async find(input: {
            id: number;
        }) {
            const row = await repository.findQuestion(input.id);
            if (!row)
                throw new DomainError("NOT_FOUND", "Question tidak ditemukan");
            const choices = await repository.listChoices(input.id);
            return {
                question: {
                    id: row.id,
                    type: row.type,
                    content: readTiptapContent(row.contentJson, row.content),
                    discussion: readTiptapContent(row.discussionJson, row.discussion),
                    essayCorrectAnswer: row.essayCorrectAnswer,
                    tags: row.tags,
                },
                choices,
            };
        },
    };
}
export const questionService = createQuestionService({ repository: createQuestionRepository(db) });
