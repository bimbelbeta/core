import type { DbClient } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	tryout,
	tryoutAccessCode,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { and, asc, desc, eq, getTableColumns, gt, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { CreditRepository } from "@/features/credit/repository";
import { escapeLikePattern } from "@/lib/utils";
import type { SubtestQuestionRow } from "./question-utils";
import type { TryoutScoreResult } from "./scoring";

export type TryoutRow = typeof tryout.$inferSelect;
export type SubtestRow = typeof tryoutSubtest.$inferSelect;
export type AttemptRow = typeof tryoutAttempt.$inferSelect;
export type SubtestAttemptRow = typeof tryoutSubtestAttempt.$inferSelect;
export type AccessCodeRow = typeof tryoutAccessCode.$inferSelect;
export type TryoutSubtestQuestionRow = typeof tryoutSubtestQuestion.$inferSelect;

export type TryoutInsert = typeof tryout.$inferInsert;
export type SubtestInsert = typeof tryoutSubtest.$inferInsert;
export type AttemptInsert = typeof tryoutAttempt.$inferInsert;
export type SubtestAttemptInsert = typeof tryoutSubtestAttempt.$inferInsert;
export type AccessCodeInsert = typeof tryoutAccessCode.$inferInsert;
export type SubtestQuestionInsert = typeof tryoutSubtestQuestion.$inferInsert;

export type TryoutChanges = Partial<TryoutInsert>;
export type SubtestChanges = Partial<SubtestInsert>;

export type TryoutStatus = TryoutRow["status"];
export type AttemptStatus = AttemptRow["status"];
export type QuestionType = "multiple_choice" | "multiple_choice_complex" | "essay";

export type TryoutWithSubtests = TryoutRow & { subtests: SubtestRow[] };
export type AttemptWithSubtestAttempts = AttemptRow & { subtestAttempts: SubtestAttemptRow[] };
export type AccessCodeSummary = Pick<AccessCodeRow, "id" | "isActive" | "expiresAt" | "maxUses" | "usedCount">;
export type AccessCodeView = Pick<
	AccessCodeRow,
	"id" | "codePreview" | "label" | "isActive" | "expiresAt" | "maxUses" | "usedCount" | "createdAt" | "updatedAt"
>;
export type SubmissionAttempt = AttemptRow & {
	tryout: TryoutWithSubtests | null;
	subtestAttempts: SubtestAttemptRow[];
};
export type SubtestStartAttempt = Pick<AttemptRow, "id" | "deadline"> & {
	subtestAttempts: SubtestAttemptRow[];
	tryout: (Pick<TryoutRow, "id"> & { subtests: SubtestRow[] }) | null;
};
export type ActiveSessionAttempt = Pick<AttemptRow, "id"> & {
	subtestAttempts: Array<Pick<SubtestAttemptRow, "status" | "deadline">>;
};
export type MemberTryoutListItem = {
	id: number;
	title: string;
	passingGrade: number;
	startsAt: Date | null;
	endsAt: Date | null;
	attemptId: number | null;
	category: TryoutRow["category"];
	attemptStatus: AttemptStatus | null;
};
export type FeaturedTryoutRow = MemberTryoutListItem & {
	startedAt: Date | null;
	completedAt: Date | null;
};
export type HistoryRow = {
	id: number;
	score: string | null;
	status: AttemptStatus;
	startedAt: Date;
	completedAt: Date | null;
	tryout: { id: number; title: string };
};
export type ResultRow = {
	id: number;
	startedAt: Date;
	score: string | null;
	deadline: Date;
	completedAt: Date | null;
	status: AttemptStatus;
	usedCredit: boolean;
	usedAccessCode: boolean;
	tryout: {
		id: number;
		title: string;
		category: TryoutRow["category"];
		passingGrade: number;
		subtests: Array<Pick<SubtestRow, "id" | "name" | "duration">>;
	};
	subtestAttempts: Array<Pick<SubtestAttemptRow, "id" | "subtestId" | "status" | "completedAt" | "score">>;
};
export type ReviewAttemptRow = Pick<AttemptRow, "id" | "usedCredit" | "usedAccessCode"> & {
	subtestAttempts: SubtestAttemptRow[];
};
export type ScoringAnswerRow = {
	questionId: number;
	selectedChoiceId: number | null;
	selectedChoiceIds: number[] | null;
	essayAnswer: string | null;
	selectedChoiceCorrect: boolean | null;
};
export type AnswerFields = {
	selectedChoiceId: number | null;
	selectedChoiceIds: number[] | null;
	essayAnswer: string | null;
};
export type AdminAttemptItem = {
	attempt: AttemptRow;
	user: { id: string; name: string; email: string; image: string | null };
};
export type SubtestScorePair = {
	tryoutAttemptId: number;
	subtestId: number;
	score: string | null;
};
export type AdminSubtestQuestion = {
	id: number;
	order: number | null;
	question: {
		id: number;
		type: QuestionType;
		content: string;
		contentJson: unknown;
	};
};
export type MemberListQuery = {
	userId: string;
	limit: number;
	backward: boolean;
	cursorId: number | null;
};
export type AdminListQuery = {
	limit: number;
	backward: boolean;
	cursorId?: number;
	search?: string;
	category?: TryoutRow["category"];
	status?: TryoutStatus;
	newestFirst: boolean;
};

type AdminFilters = { search?: string; category?: TryoutRow["category"]; status?: TryoutStatus };

function adminFilters({ search, category, status }: AdminFilters) {
	return and(
		search ? ilike(tryout.title, `%${escapeLikePattern(search)}%`) : undefined,
		category ? eq(tryout.category, category) : undefined,
		status ? eq(tryout.status, status) : undefined,
	);
}

const subtestCountColumn =
	sql<number>`(select count(*) from ${tryoutSubtest} where ${tryoutSubtest.tryoutId} = ${tryout.id})`.mapWith(Number);
const attemptCountColumn =
	sql<number>`(select count(*) from ${tryoutAttempt} where ${tryoutAttempt.tryoutId} = ${tryout.id})`.mapWith(Number);

export function createTryoutRepository(client: DbClient) {
	async function findPublishedTryoutWithSubtests(id: number): Promise<TryoutWithSubtests | undefined> {
		return client.query.tryout.findFirst({
			where: { id: { eq: id }, status: { eq: "published" } },
			with: { subtests: { orderBy: (subtests, { asc }) => [asc(subtests.order)] } },
		});
	}

	async function findTryoutById(id: number): Promise<TryoutRow | undefined> {
		const [row] = await client.select().from(tryout).where(eq(tryout.id, id)).limit(1);
		return row;
	}

	async function findTryoutId(id: number): Promise<Pick<TryoutRow, "id"> | undefined> {
		const [row] = await client.select({ id: tryout.id }).from(tryout).where(eq(tryout.id, id)).limit(1);
		return row;
	}

	async function listForMember({
		userId,
		limit,
		cursorId,
		backward,
	}: MemberListQuery): Promise<MemberTryoutListItem[]> {
		return client
			.select({
				id: tryout.id,
				title: tryout.title,
				passingGrade: tryout.passingGrade,
				startsAt: tryout.startsAt,
				endsAt: tryout.endsAt,
				attemptId: tryoutAttempt.id,
				category: tryout.category,
				attemptStatus: tryoutAttempt.status,
			})
			.from(tryout)
			.leftJoin(tryoutAttempt, and(eq(tryoutAttempt.tryoutId, tryout.id), eq(tryoutAttempt.userId, userId)))
			.where(
				and(
					eq(tryout.status, "published"),
					cursorId !== null ? (backward ? lt(tryout.id, cursorId) : gt(tryout.id, cursorId)) : undefined,
				),
			)
			.orderBy(backward ? desc(tryout.id) : desc(tryout.startsAt))
			.limit(limit + 1);
	}

	async function findFeatured(userId: string): Promise<FeaturedTryoutRow | undefined> {
		const [row] = await client
			.select({
				id: tryout.id,
				title: tryout.title,
				category: tryout.category,
				passingGrade: tryout.passingGrade,
				startsAt: tryout.startsAt,
				endsAt: tryout.endsAt,
				startedAt: tryoutAttempt.startedAt,
				completedAt: tryoutAttempt.completedAt,
				attemptId: tryoutAttempt.id,
				attemptStatus: tryoutAttempt.status,
			})
			.from(tryout)
			.leftJoin(tryoutAttempt, and(eq(tryoutAttempt.tryoutId, tryout.id), eq(tryoutAttempt.userId, userId)))
			.where(eq(tryout.status, "published"))
			.orderBy(desc(tryout.startsAt));
		return row;
	}

	async function listHistory(userId: string): Promise<HistoryRow[]> {
		const rows = await client.query.tryoutAttempt.findMany({
			columns: { id: true, score: true, status: true, startedAt: true, completedAt: true },
			where: { userId: { eq: userId }, status: { eq: "finished" } },
			orderBy: { startedAt: "desc" },
			with: { tryout: { columns: { id: true, title: true } } },
		});
		return rows.map((row) => ({ ...row, tryout: row.tryout! }));
	}

	async function findFinishedAttemptResult(attemptId: number, userId: string): Promise<ResultRow | undefined> {
		const attempt = await client.query.tryoutAttempt.findFirst({
			columns: {
				id: true,
				startedAt: true,
				score: true,
				deadline: true,
				completedAt: true,
				status: true,
				usedCredit: true,
				usedAccessCode: true,
			},
			where: { id: { eq: attemptId }, userId: { eq: userId }, status: { eq: "finished" } },
			with: {
				tryout: {
					columns: { id: true, title: true, category: true, passingGrade: true },
					with: {
						subtests: {
							orderBy: (subtests, { asc }) => [asc(subtests.order)],
							columns: { id: true, name: true, duration: true },
						},
					},
				},
				subtestAttempts: {
					columns: { id: true, subtestId: true, status: true, completedAt: true, score: true },
				},
			},
		});
		if (!attempt?.tryout) return undefined;
		return { ...attempt, tryout: attempt.tryout };
	}

	async function findAttemptForReview(attemptId: number, userId: string): Promise<ReviewAttemptRow | undefined> {
		return client.query.tryoutAttempt.findFirst({
			columns: { id: true, usedCredit: true, usedAccessCode: true },
			where: { id: { eq: attemptId }, userId: { eq: userId } },
			with: { subtestAttempts: true },
		});
	}

	async function findSubtestName(subtestId: number): Promise<Pick<SubtestRow, "name"> | undefined> {
		const [row] = await client
			.select({ name: tryoutSubtest.name })
			.from(tryoutSubtest)
			.where(eq(tryoutSubtest.id, subtestId))
			.limit(1);
		return row;
	}

	async function listSubtestQuestionRows(subtestId: number, attemptId: number): Promise<SubtestQuestionRow[]> {
		return client
			.select({
				questionId: question.id,
				questionContent: question.content,
				questionContentJson: question.contentJson,
				questionType: question.type,
				discussion: question.discussion,
				discussionJson: question.discussionJson,
				choiceId: questionChoice.id,
				choiceContent: questionChoice.content,
				choiceCode: questionChoice.code,
				isCorrectChoice: questionChoice.isCorrect,
				userSelectedChoiceId: tryoutUserAnswer.selectedChoiceId,
				userSelectedChoiceIds: tryoutUserAnswer.selectedChoiceIds,
				userEssayAnswer: tryoutUserAnswer.essayAnswer,
				userIsDoubtful: tryoutUserAnswer.isDoubtful,
			})
			.from(tryoutSubtestQuestion)
			.innerJoin(question, eq(question.id, tryoutSubtestQuestion.questionId))
			.leftJoin(questionChoice, eq(questionChoice.questionId, question.id))
			.leftJoin(
				tryoutUserAnswer,
				and(eq(tryoutUserAnswer.questionId, question.id), eq(tryoutUserAnswer.attemptId, attemptId)),
			)
			.where(eq(tryoutSubtestQuestion.subtestId, subtestId))
			.orderBy(tryoutSubtestQuestion.order);
	}

	async function findAttempt(tryoutId: number, userId: string): Promise<AttemptRow | undefined> {
		const [row] = await client
			.select()
			.from(tryoutAttempt)
			.where(and(eq(tryoutAttempt.tryoutId, tryoutId), eq(tryoutAttempt.userId, userId)))
			.limit(1);
		return row;
	}

	async function findAttemptWithSubtestAttempts(
		tryoutId: number,
		userId: string,
	): Promise<AttemptWithSubtestAttempts | undefined> {
		return client.query.tryoutAttempt.findFirst({
			where: { tryoutId: { eq: tryoutId }, userId: { eq: userId } },
			with: { subtestAttempts: true },
		});
	}

	async function findOngoingAttemptForSession(
		tryoutId: number,
		userId: string,
	): Promise<ActiveSessionAttempt | undefined> {
		return client.query.tryoutAttempt.findFirst({
			columns: { id: true },
			where: { tryoutId: { eq: tryoutId }, userId: { eq: userId }, status: { eq: "ongoing" } },
			with: { subtestAttempts: { columns: { status: true, deadline: true } } },
		});
	}

	async function findAttemptForSubmission(tryoutId: number, userId: string): Promise<SubmissionAttempt | undefined> {
		return client.query.tryoutAttempt.findFirst({
			where: { tryoutId: { eq: tryoutId }, userId: { eq: userId }, status: { eq: "ongoing" } },
			with: {
				subtestAttempts: true,
				tryout: { with: { subtests: { orderBy: (subtests, { asc }) => [asc(subtests.order)] } } },
			},
		});
	}

	async function findAttemptForSubtestStart(
		tryoutId: number,
		userId: string,
	): Promise<SubtestStartAttempt | undefined> {
		return client.query.tryoutAttempt.findFirst({
			columns: { id: true, deadline: true },
			where: { tryoutId: { eq: tryoutId }, userId: { eq: userId } },
			with: {
				subtestAttempts: true,
				tryout: {
					columns: { id: true },
					with: { subtests: { orderBy: (subtests, { asc }) => [asc(subtests.order)] } },
				},
			},
		});
	}

	async function listSubtestsForTryout(tryoutId: number): Promise<(SubtestRow & { questionCount: number })[]> {
		const questionCount =
			sql<number>`(select count(*) from ${tryoutSubtestQuestion} where ${tryoutSubtestQuestion.subtestId} = ${tryoutSubtest.id})`.mapWith(
				Number,
			);
		return client
			.select({ ...getTableColumns(tryoutSubtest), questionCount })
			.from(tryoutSubtest)
			.where(eq(tryoutSubtest.tryoutId, tryoutId))
			.orderBy(tryoutSubtest.order);
	}

	async function insertAttempt(values: AttemptInsert): Promise<AttemptRow | undefined> {
		const [row] = await client.insert(tryoutAttempt).values(values).returning();
		return row;
	}

	async function insertSubtestAttempt(values: SubtestAttemptInsert): Promise<SubtestAttemptRow | undefined> {
		const [row] = await client.insert(tryoutSubtestAttempt).values(values).returning();
		return row;
	}

	async function consumeAccessCodeQuota(codeId: number): Promise<Pick<AccessCodeRow, "id"> | undefined> {
		const [row] = await client
			.update(tryoutAccessCode)
			.set({ usedCount: sql`${tryoutAccessCode.usedCount} + 1` })
			.where(
				and(
					eq(tryoutAccessCode.id, codeId),
					or(isNull(tryoutAccessCode.maxUses), sql`${tryoutAccessCode.usedCount} < ${tryoutAccessCode.maxUses}`),
				),
			)
			.returning({ id: tryoutAccessCode.id });
		return row;
	}

	async function upsertAnswer(attemptId: number, questionId: number, fields: AnswerFields): Promise<void> {
		await client
			.insert(tryoutUserAnswer)
			.values({ attemptId, questionId, ...fields })
			.onConflictDoUpdate({
				target: [tryoutUserAnswer.attemptId, tryoutUserAnswer.questionId],
				set: fields,
			});
	}

	async function toggleAnswerDoubtful(attemptId: number, questionId: number): Promise<void> {
		await client
			.insert(tryoutUserAnswer)
			.values({ attemptId, questionId, isDoubtful: true })
			.onConflictDoUpdate({
				target: [tryoutUserAnswer.attemptId, tryoutUserAnswer.questionId],
				set: { isDoubtful: sql`NOT ${tryoutUserAnswer.isDoubtful}` },
			});
	}

	async function listSubtestAttemptScoreInputs(
		attemptId: number,
	): Promise<Array<Pick<SubtestAttemptRow, "id" | "subtestId"> & { scoringMap: SubtestRow["scoringMap"] }>> {
		return client
			.select({
				id: tryoutSubtestAttempt.id,
				subtestId: tryoutSubtestAttempt.subtestId,
				scoringMap: tryoutSubtest.scoringMap,
			})
			.from(tryoutSubtestAttempt)
			.innerJoin(tryoutSubtest, eq(tryoutSubtest.id, tryoutSubtestAttempt.subtestId))
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, attemptId));
	}

	async function listAnswersWithSelectedChoice(attemptId: number): Promise<ScoringAnswerRow[]> {
		const rows = await client.query.tryoutUserAnswer.findMany({
			where: { attemptId: { eq: attemptId } },
			with: { selectedChoice: { columns: { isCorrect: true } } },
		});
		return rows.map((row) => ({
			questionId: row.questionId,
			selectedChoiceId: row.selectedChoiceId,
			selectedChoiceIds: row.selectedChoiceIds,
			essayAnswer: row.essayAnswer,
			selectedChoiceCorrect: row.selectedChoice ? row.selectedChoice.isCorrect : null,
		}));
	}

	async function listSubtestQuestionPairs(
		subtestIds: number[],
	): Promise<Array<{ subtestId: number; questionId: number }>> {
		return client
			.select({ subtestId: tryoutSubtestQuestion.subtestId, questionId: tryoutSubtestQuestion.questionId })
			.from(tryoutSubtestQuestion)
			.where(inArray(tryoutSubtestQuestion.subtestId, subtestIds));
	}

	async function listQuestionsForScoring(
		questionIds: number[],
	): Promise<Array<{ id: number; type: QuestionType; essayCorrectAnswer: string | null }>> {
		return client
			.select({ id: question.id, type: question.type, essayCorrectAnswer: question.essayCorrectAnswer })
			.from(question)
			.where(inArray(question.id, questionIds));
	}

	async function listChoiceCorrectness(
		questionIds: number[],
	): Promise<Array<{ questionId: number; id: number; isCorrect: boolean }>> {
		return client
			.select({ questionId: questionChoice.questionId, id: questionChoice.id, isCorrect: questionChoice.isCorrect })
			.from(questionChoice)
			.where(inArray(questionChoice.questionId, questionIds));
	}

	async function finishSubtestAttempt(id: number): Promise<void> {
		await client
			.update(tryoutSubtestAttempt)
			.set({ status: "finished", completedAt: new Date() })
			.where(eq(tryoutSubtestAttempt.id, id));
	}

	async function finishAttempt(id: number): Promise<void> {
		await client
			.update(tryoutAttempt)
			.set({ completedAt: new Date(), status: "finished" })
			.where(eq(tryoutAttempt.id, id));
	}

	async function saveScores(attemptId: number, scores: TryoutScoreResult): Promise<void> {
		if (scores.subtests.length > 0) {
			const caseExpr = sql.join(
				scores.subtests.map(
					(s) => sql`WHEN ${tryoutSubtestAttempt.id} = ${s.subtestAttemptId} THEN ${s.score}::numeric`,
				),
				sql` `,
			);
			const ids = scores.subtests.map((s) => s.subtestAttemptId);
			await client
				.update(tryoutSubtestAttempt)
				.set({ score: sql`CASE ${caseExpr} END` })
				.where(inArray(tryoutSubtestAttempt.id, ids));
		}
		await client
			.update(tryoutAttempt)
			.set({ score: scores.totalScore.toString() })
			.where(eq(tryoutAttempt.id, attemptId));
	}

	async function insertTryout(values: TryoutInsert): Promise<TryoutRow | undefined> {
		const [row] = await client.insert(tryout).values(values).returning();
		return row;
	}

	async function listForAdmin({
		limit,
		backward,
		cursorId,
		search,
		category,
		status,
		newestFirst,
	}: AdminListQuery): Promise<(TryoutRow & { subtestCount: number; attemptCount: number })[]> {
		const descending = newestFirst !== backward;
		return client
			.select({ ...getTableColumns(tryout), subtestCount: subtestCountColumn, attemptCount: attemptCountColumn })
			.from(tryout)
			.where(
				and(
					adminFilters({ search, category, status }),
					cursorId !== undefined ? (descending ? lt(tryout.id, cursorId) : gt(tryout.id, cursorId)) : undefined,
				),
			)
			.orderBy(descending ? desc(tryout.id) : asc(tryout.id))
			.limit(limit + 1);
	}

	async function countForAdmin(filters: AdminFilters): Promise<number> {
		const [row] = await client.select({ count: sql<number>`count(*)::int` }).from(tryout).where(adminFilters(filters));
		return row?.count ?? 0;
	}

	async function updateTryout(id: number, changes: TryoutChanges): Promise<TryoutRow | undefined> {
		const [row] = await client.update(tryout).set(changes).where(eq(tryout.id, id)).returning();
		return row;
	}

	async function deleteTryout(id: number): Promise<TryoutRow | undefined> {
		const [row] = await client.delete(tryout).where(eq(tryout.id, id)).returning();
		return row;
	}

	async function findAccessCode(tryoutId: number, codeHash: string): Promise<AccessCodeSummary | undefined> {
		const [row] = await client
			.select({
				id: tryoutAccessCode.id,
				isActive: tryoutAccessCode.isActive,
				expiresAt: tryoutAccessCode.expiresAt,
				maxUses: tryoutAccessCode.maxUses,
				usedCount: tryoutAccessCode.usedCount,
			})
			.from(tryoutAccessCode)
			.where(and(eq(tryoutAccessCode.tryoutId, tryoutId), eq(tryoutAccessCode.codeHash, codeHash)))
			.limit(1);
		return row;
	}

	async function listAccessCodes(tryoutId: number): Promise<AccessCodeView[]> {
		return client
			.select({
				id: tryoutAccessCode.id,
				codePreview: tryoutAccessCode.codePreview,
				label: tryoutAccessCode.label,
				isActive: tryoutAccessCode.isActive,
				expiresAt: tryoutAccessCode.expiresAt,
				maxUses: tryoutAccessCode.maxUses,
				usedCount: tryoutAccessCode.usedCount,
				createdAt: tryoutAccessCode.createdAt,
				updatedAt: tryoutAccessCode.updatedAt,
			})
			.from(tryoutAccessCode)
			.where(eq(tryoutAccessCode.tryoutId, tryoutId))
			.orderBy(desc(tryoutAccessCode.createdAt));
	}

	async function insertAccessCode(values: AccessCodeInsert): Promise<AccessCodeView | undefined> {
		const [row] = await client.insert(tryoutAccessCode).values(values).returning({
			id: tryoutAccessCode.id,
			codePreview: tryoutAccessCode.codePreview,
			label: tryoutAccessCode.label,
			isActive: tryoutAccessCode.isActive,
			expiresAt: tryoutAccessCode.expiresAt,
			maxUses: tryoutAccessCode.maxUses,
			usedCount: tryoutAccessCode.usedCount,
			createdAt: tryoutAccessCode.createdAt,
			updatedAt: tryoutAccessCode.updatedAt,
		});
		return row;
	}

	async function updateAccessCodeStatus(
		tryoutId: number,
		accessCodeId: number,
		isActive: boolean,
	): Promise<Pick<AccessCodeRow, "id" | "isActive"> | undefined> {
		const [row] = await client
			.update(tryoutAccessCode)
			.set({ isActive, updatedAt: new Date() })
			.where(and(eq(tryoutAccessCode.id, accessCodeId), eq(tryoutAccessCode.tryoutId, tryoutId)))
			.returning({ id: tryoutAccessCode.id, isActive: tryoutAccessCode.isActive });
		return row;
	}

	async function listAttemptsWithUsers(
		tryoutId: number,
		{ limit, backward, cursorId }: { limit: number; backward: boolean; cursorId?: number },
	): Promise<AdminAttemptItem[]> {
		return client
			.select({
				attempt: tryoutAttempt,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			})
			.from(tryoutAttempt)
			.innerJoin(user, eq(user.id, tryoutAttempt.userId))
			.where(
				and(
					eq(tryoutAttempt.tryoutId, tryoutId),
					cursorId !== undefined
						? backward
							? lt(tryoutAttempt.id, cursorId)
							: gt(tryoutAttempt.id, cursorId)
						: undefined,
				),
			)
			.orderBy(backward ? desc(tryoutAttempt.id) : asc(tryoutAttempt.id))
			.limit(limit + 1);
	}

	async function listSubtestAttemptScores(tryoutAttemptIds: number[]): Promise<SubtestScorePair[]> {
		return client
			.select({
				tryoutAttemptId: tryoutSubtestAttempt.tryoutAttemptId,
				subtestId: tryoutSubtestAttempt.subtestId,
				score: tryoutSubtestAttempt.score,
			})
			.from(tryoutSubtestAttempt)
			.where(inArray(tryoutSubtestAttempt.tryoutAttemptId, tryoutAttemptIds))
			.orderBy(asc(tryoutSubtestAttempt.subtestId));
	}

	async function findSubtestById(id: number): Promise<SubtestRow | undefined> {
		const [row] = await client.select().from(tryoutSubtest).where(eq(tryoutSubtest.id, id)).limit(1);
		return row;
	}

	async function maxSubtestOrder(tryoutId: number): Promise<number | null> {
		const [row] = await client
			.select({ maxOrder: sql<number | null>`max(${tryoutSubtest.order})` })
			.from(tryoutSubtest)
			.where(eq(tryoutSubtest.tryoutId, tryoutId));
		return row?.maxOrder ?? null;
	}

	async function insertSubtest(values: SubtestInsert): Promise<SubtestRow | undefined> {
		const [row] = await client.insert(tryoutSubtest).values(values).returning();
		return row;
	}

	async function updateSubtest(id: number, changes: SubtestChanges): Promise<SubtestRow | undefined> {
		const [row] = await client.update(tryoutSubtest).set(changes).where(eq(tryoutSubtest.id, id)).returning();
		return row;
	}

	async function deleteSubtest(id: number): Promise<SubtestRow | undefined> {
		const [row] = await client.delete(tryoutSubtest).where(eq(tryoutSubtest.id, id)).returning();
		return row;
	}

	async function listSubtestQuestions(subtestId: number): Promise<AdminSubtestQuestion[]> {
		return client
			.select({
				id: tryoutSubtestQuestion.questionId,
				order: tryoutSubtestQuestion.order,
				question: {
					id: question.id,
					type: question.type,
					content: question.content,
					contentJson: question.contentJson,
				},
			})
			.from(tryoutSubtestQuestion)
			.innerJoin(question, eq(question.id, tryoutSubtestQuestion.questionId))
			.where(eq(tryoutSubtestQuestion.subtestId, subtestId))
			.orderBy(tryoutSubtestQuestion.order);
	}

	async function findSubtestQuestion(
		subtestId: number,
		questionId: number,
	): Promise<Pick<TryoutSubtestQuestionRow, "subtestId" | "questionId"> | undefined> {
		const [row] = await client
			.select({ subtestId: tryoutSubtestQuestion.subtestId, questionId: tryoutSubtestQuestion.questionId })
			.from(tryoutSubtestQuestion)
			.where(and(eq(tryoutSubtestQuestion.subtestId, subtestId), eq(tryoutSubtestQuestion.questionId, questionId)))
			.limit(1);
		return row;
	}

	async function listSubtestQuestionIds(subtestId: number): Promise<Array<{ questionId: number }>> {
		return client
			.select({ questionId: tryoutSubtestQuestion.questionId })
			.from(tryoutSubtestQuestion)
			.where(eq(tryoutSubtestQuestion.subtestId, subtestId));
	}

	async function maxQuestionOrder(subtestId: number): Promise<number | null> {
		const [row] = await client
			.select({ maxOrder: sql<number | null>`max(${tryoutSubtestQuestion.order})` })
			.from(tryoutSubtestQuestion)
			.where(eq(tryoutSubtestQuestion.subtestId, subtestId));
		return row?.maxOrder ?? null;
	}

	async function insertSubtestQuestion(values: SubtestQuestionInsert): Promise<void> {
		await client.insert(tryoutSubtestQuestion).values(values);
	}

	async function insertSubtestQuestions(values: SubtestQuestionInsert[]): Promise<void> {
		await client.insert(tryoutSubtestQuestion).values(values);
	}

	async function updateSubtestQuestionOrder(questionId: number, order: number): Promise<TryoutSubtestQuestionRow[]> {
		return client
			.update(tryoutSubtestQuestion)
			.set({ order })
			.where(eq(tryoutSubtestQuestion.questionId, questionId))
			.returning();
	}

	async function deleteSubtestQuestions(subtestId: number, questionIds: number[]): Promise<TryoutSubtestQuestionRow[]> {
		return client
			.delete(tryoutSubtestQuestion)
			.where(
				and(eq(tryoutSubtestQuestion.subtestId, subtestId), inArray(tryoutSubtestQuestion.questionId, questionIds)),
			)
			.returning();
	}

	async function deleteSubtestQuestion(subtestId: number, questionId: number): Promise<TryoutSubtestQuestionRow[]> {
		return client
			.delete(tryoutSubtestQuestion)
			.where(and(eq(tryoutSubtestQuestion.questionId, questionId), eq(tryoutSubtestQuestion.subtestId, subtestId)))
			.returning();
	}

	async function listRecentWithCounts(limit: number): Promise<
		{
			id: number;
			title: string;
			status: TryoutStatus;
			category: TryoutRow["category"];
			updatedAt: Date | null;
			subtestCount: number;
			attemptCount: number;
		}[]
	> {
		return client
			.select({
				id: tryout.id,
				title: tryout.title,
				status: tryout.status,
				category: tryout.category,
				updatedAt: tryout.updatedAt,
				subtestCount: subtestCountColumn,
				attemptCount: attemptCountColumn,
			})
			.from(tryout)
			.orderBy(desc(tryout.updatedAt))
			.limit(limit);
	}

	return {
		findPublishedTryoutWithSubtests,
		findTryoutById,
		findTryoutId,
		listForMember,
		findFeatured,
		listHistory,
		findFinishedAttemptResult,
		findAttemptForReview,
		findSubtestName,
		listSubtestQuestionRows,
		findAttempt,
		findAttemptWithSubtestAttempts,
		findOngoingAttemptForSession,
		findAttemptForSubmission,
		findAttemptForSubtestStart,
		listSubtestsForTryout,
		countForAdmin,
		listRecentWithCounts,
		insertAttempt,
		insertSubtestAttempt,
		consumeAccessCodeQuota,
		upsertAnswer,
		toggleAnswerDoubtful,
		listSubtestAttemptScoreInputs,
		listAnswersWithSelectedChoice,
		listSubtestQuestionPairs,
		listQuestionsForScoring,
		listChoiceCorrectness,
		finishSubtestAttempt,
		finishAttempt,
		saveScores,
		insertTryout,
		listForAdmin,
		updateTryout,
		deleteTryout,
		findAccessCode,
		listAccessCodes,
		insertAccessCode,
		updateAccessCodeStatus,
		listAttemptsWithUsers,
		listSubtestAttemptScores,
		findSubtestById,
		maxSubtestOrder,
		insertSubtest,
		updateSubtest,
		deleteSubtest,
		listSubtestQuestions,
		findSubtestQuestion,
		listSubtestQuestionIds,
		maxQuestionOrder,
		insertSubtestQuestion,
		insertSubtestQuestions,
		updateSubtestQuestionOrder,
		deleteSubtestQuestions,
		deleteSubtestQuestion,
	};
}

export type TryoutRepository = ReturnType<typeof createTryoutRepository>;

export type TryoutTransaction<R = TryoutRepository> = {
	repository: R;
	credit: Pick<CreditRepository, "deductCreditForTryoutAttempt">;
};
