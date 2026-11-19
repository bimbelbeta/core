import { describe, expect, test } from "bun:test";
import type { Session } from "@/context";
import { createDateIdCursor } from "@/lib/pagination/cursor";
import type { SubtestQuestionRow } from "./question-utils";
import type { ReadServiceDependencies } from "./read.service";
import { createTryoutReadService } from "./read.service";
import type {
	ActiveAttemptRow,
	AttemptWithSubtestAttempts,
	FeaturedTryoutRow,
	HistoryRow,
	MemberListQuery,
	MemberTryoutListItem,
	ResultRow,
	ReviewAttemptRow,
	SubtestScoringInput,
	TryoutWithSubtests,
} from "./repository";

const caller: Session["user"] = {
	id: "user-1",
	name: "user-1",
	email: "user-1@example.com",
	emailVerified: false,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	role: "user",
	isPremium: false,
	premiumExpiresAt: null,
	tryoutCredits: 1,
	targetUniversityId: null,
	targetStudyProgramId: null,
};
const subtests = [
	{
		id: 10,
		tryoutId: 1,
		name: "First",
		description: null,
		duration: 30,
		questionOrder: "sequential",
		order: 1,
		scoringMap: null,
		createdAt: null,
		updatedAt: null,
	},
	{
		id: 11,
		tryoutId: 1,
		name: "Second",
		description: null,
		duration: 30,
		questionOrder: "sequential",
		order: 2,
		scoringMap: null,
		createdAt: null,
		updatedAt: null,
	},
];
const tryout: TryoutWithSubtests = {
	id: 1,
	title: "Tryout",
	description: null,
	passingGrade: 600,
	category: "utbk" as const,
	status: "published" as const,
	startsAt: null,
	endsAt: null,
	createdAt: null,
	updatedAt: null,
	subtests,
};
const subtestAttemptFinished = {
	id: 5,
	tryoutAttemptId: 8,
	subtestId: 10,
	startedAt: new Date(),
	completedAt: new Date(),
	deadline: new Date("2100-01-01"),
	status: "finished" as const,
	score: "800",
};
const subtestAttemptOngoing = {
	id: 6,
	tryoutAttemptId: 8,
	subtestId: 11,
	startedAt: new Date(),
	completedAt: null,
	deadline: new Date("2100-01-01"),
	status: "ongoing" as const,
	score: null,
};
const attempt: AttemptWithSubtestAttempts = {
	id: 8,
	userId: "user-1",
	tryoutId: 1,
	attemptNumber: 1,
	startedAt: new Date(),
	deadline: new Date("2100-01-01"),
	completedAt: null,
	breakEndsAt: null,
	status: "ongoing" as const,
	score: null,
	submittedImageUrl: null,
	isRevoked: false,
	usedCredit: true,
	usedAccessCode: false,
	accessCodeId: null,
	subtestAttempts: [subtestAttemptFinished],
};
const questionRows = [
	{
		questionId: 21,
		questionContent: "Berapa hasil 1 + 1?",
		questionContentJson: null,
		questionType: "multiple_choice" as const,
		essayCorrectAnswer: null,
		discussion: "Pembahasan",
		discussionJson: null,
		choiceId: 31,
		choiceContent: "2",
		choiceCode: "A",
		isCorrectChoice: true,
		userSelectedChoiceId: 31,
		userSelectedChoiceIds: null,
		userEssayAnswer: null,
		userIsDoubtful: false,
	},
];

type ReadRepositoryOverrides = {
	tryouts?: Array<TryoutWithSubtests | undefined>;
	tryout?: TryoutWithSubtests | undefined;
	attempts?: Array<AttemptWithSubtestAttempts | undefined>;
	attempt?: AttemptWithSubtestAttempts | undefined;
	activeAttempts?: ActiveAttemptRow[];
	featured?: FeaturedTryoutRow | undefined;
	history?: HistoryRow[];
	scoringInputs?: SubtestScoringInput[];
	result?: ResultRow | undefined;
	reviewAttempt?: ReviewAttemptRow | undefined;
	subtestName?: { name: string } | undefined;
	rows?: SubtestQuestionRow[][];
	subtestQuestionRows?: SubtestQuestionRow[][];
	finalized: number[];
};

function makeRepository(overrides: ReadRepositoryOverrides) {
	const pendingTryouts = overrides.tryouts ? [...overrides.tryouts] : [];
	const pendingAttempts = overrides.attempts ? [...overrides.attempts] : [];
	const pendingRows = overrides.subtestQuestionRows ? [...overrides.subtestQuestionRows] : [];
	return {
		findPublishedTryoutWithSubtests: async () =>
			pendingTryouts.length > 0 ? pendingTryouts.shift() : overrides.tryout,
		findAttemptWithSubtestAttempts: async () =>
			pendingAttempts.length > 0 ? pendingAttempts.shift() : overrides.attempt,
		listSubtestsForTryout: async () => subtests,
		listForMember: async (): Promise<MemberTryoutListItem[]> => [],
		listActiveAttempts: async (): Promise<ActiveAttemptRow[]> => overrides.activeAttempts ?? [],
		findFeatured: async () => overrides.featured,
		listHistory: async () => overrides.history ?? [],
		listSubtestScoringInputs: async () => overrides.scoringInputs ?? [],
		findFinishedAttemptResult: async () => overrides.result,
		findAttemptForReview: async () => overrides.reviewAttempt,
		findSubtestName: async () => overrides.subtestName,
		listSubtestQuestionRows: async () => pendingRows.shift() ?? questionRows,
	};
}

function makeService(overrides: ReadRepositoryOverrides) {
	const repository = makeRepository(overrides);
	const deps: ReadServiceDependencies = {
		repository,
		finalizeExpiredAttempt: async (attemptId: number) => {
			overrides.finalized.push(attemptId);
		},
	};
	return { service: createTryoutReadService(deps), repository };
}

function baseOverrides(): ReadRepositoryOverrides {
	return { finalized: [] };
}

describe("tryout find (resume)", () => {
	test("rejects a tryout that is not published", async () => {
		const { service } = makeService({ ...baseOverrides(), tryout: undefined });
		await expect(service.find({ id: 1 }, caller)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Tryout tidak ditemukan.",
		});
	});

	test("rejects a caller without an attempt or with a revoked attempt", async () => {
		const missing = makeService({ ...baseOverrides(), tryout, attempt: undefined });
		await expect(missing.service.find({ id: 1 }, caller)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
			message: "Gagal menemukan pengerjaan tryout.",
		});
		const revoked = makeService({
			...baseOverrides(),
			tryout,
			attempt: { ...attempt, isRevoked: true },
		});
		await expect(revoked.service.find({ id: 1 }, caller)).rejects.toMatchObject({
			code: "UNAUTHORIZED",
			message: "Gagal menemukan pengerjaan tryout.",
		});
	});

	test("returns a finished attempt with no current subtest", async () => {
		const { service } = makeService({
			...baseOverrides(),
			tryout,
			attempt: { ...attempt, status: "finished" as const, completedAt: new Date(), score: "700" },
		});
		const found = await service.find({ id: 1 }, caller);
		expect(found).toMatchObject({
			id: 1,
			currentSubtest: null,
			totalSubtests: 2,
			completedSubtests: 2,
		});
		expect(found.attempt.status).toBe("finished");
		expect(found.attempt.score).toBe(700);
	});

	test("finalizes an expired ongoing attempt instead of resuming it", async () => {
		const overrides = baseOverrides();
		const { service } = makeService({
			...overrides,
			tryout,
			attempt: { ...attempt, deadline: new Date(Date.now() - 60_000) },
		});
		const found = await service.find({ id: 1 }, caller);
		expect(overrides.finalized).toEqual([8]);
		expect(found).toMatchObject({
			currentSubtest: null,
			totalSubtests: 2,
			completedSubtests: 1,
		});
		expect(found.attempt.status).toBe("finished");
		expect(found.attempt.completedAt).toBeInstanceOf(Date);
	});

	test("resumes the current subtest with its questions and deadline", async () => {
		const { service } = makeService({
			...baseOverrides(),
			tryout,
			attempt: { ...attempt, subtestAttempts: [subtestAttemptFinished, subtestAttemptOngoing] },
		});
		const found = await service.find({ id: 1 }, caller);
		expect(found).toMatchObject({
			totalSubtests: 2,
			completedSubtests: 1,
			overallDeadline: attempt.deadline,
		});
		expect(found.currentSubtest).toMatchObject({
			id: 11,
			name: "Second",
			deadline: subtestAttemptOngoing.deadline,
			status: "ongoing",
		});
		expect(found.currentSubtest?.questions).toEqual([
			{
				id: 21,
				content: {
					type: "doc",
					content: [{ type: "paragraph", content: [{ type: "text", text: "Berapa hasil 1 + 1?" }] }],
				},
				type: "multiple_choice",
				choices: [{ id: 31, content: "2", code: "A" }],
				userAnswer: {
					selectedChoiceId: 31,
					selectedChoiceIds: null,
					essayAnswer: null,
					isDoubtful: false,
				},
			},
		]);
	});

	test("presents an untouched current subtest as not_started without questions", async () => {
		const { service } = makeService({
			...baseOverrides(),
			tryout,
			attempt: { ...attempt, subtestAttempts: [subtestAttemptFinished] },
		});
		const found = await service.find({ id: 1 }, caller);
		expect(found.currentSubtest).toMatchObject({
			id: 11,
			questions: [],
			deadline: null,
			status: "not_started",
		});
	});

	test("reports all subtests complete when every one is finished", async () => {
		const finishedSecond = { ...subtestAttemptFinished, subtestId: 11, id: 7 };
		const { service } = makeService({
			...baseOverrides(),
			tryout,
			attempt: { ...attempt, subtestAttempts: [subtestAttemptFinished, finishedSecond] },
		});
		const found = await service.find({ id: 1 }, caller);
		expect(found.currentSubtest).toBeNull();
		expect(found.completedSubtests).toBe(2);
	});
});

describe("featured tryout", () => {
	test("rejects a member with no published tryout", async () => {
		const { service } = makeService({ ...baseOverrides(), featured: undefined });
		await expect(service.featured(caller)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Gagal menemukan paket Tryout!",
		});
	});

	test("maps the attempt state to a status", async () => {
		const { service } = makeService({
			...baseOverrides(),
			featured: {
				id: 1,
				title: "Tryout",
				passingGrade: 600,
				startsAt: null,
				endsAt: null,
				attemptId: 8,
				category: "utbk" as const,
				attemptStatus: null,
				startedAt: null,
				completedAt: null,
			},
		});
		expect(await service.featured(caller)).toMatchObject({ id: 1, status: "not_started" });

		const { service: ongoing } = makeService({
			...baseOverrides(),
			featured: {
				id: 1,
				title: "Tryout",
				passingGrade: 600,
				startsAt: null,
				endsAt: null,
				attemptId: 8,
				category: "utbk" as const,
				attemptStatus: "ongoing" as const,
				startedAt: new Date(),
				completedAt: null,
			},
		});
		expect(await ongoing.featured(caller)).toMatchObject({ status: "ongoing" });
	});
});

describe("tryout list", () => {
	test("marks published tryouts open by their window", async () => {
		const now = new Date();
		const rows = [
			{
				id: 1,
				title: "Open",
				passingGrade: 600,
				startsAt: null,
				endsAt: null,
				attemptId: null,
				attemptNumber: null,
				category: "utbk" as const,
				attemptStatus: null,
			},
			{
				id: 2,
				title: "Upcoming",
				passingGrade: 600,
				startsAt: new Date(now.getTime() + 60_000),
				endsAt: null,
				attemptId: null,
				attemptNumber: null,
				category: "utbk" as const,
				attemptStatus: null,
			},
			{
				id: 3,
				title: "Closed",
				passingGrade: 600,
				startsAt: null,
				endsAt: new Date(now.getTime() - 60_000),
				attemptId: null,
				attemptNumber: null,
				category: "utbk" as const,
				attemptStatus: null,
			},
			{
				id: 4,
				title: "Closing now",
				passingGrade: 600,
				startsAt: null,
				endsAt: new Date(now.getTime() + 60_000),
				attemptId: null,
				attemptNumber: null,
				category: "utbk" as const,
				attemptStatus: null,
			},
		];
		const listCalls: MemberListQuery[] = [];
		const repository = {
			findPublishedTryoutWithSubtests: async () => undefined,
			findAttemptWithSubtestAttempts: async () => undefined,
			listForMember: async (query: MemberListQuery) => {
				listCalls.push(query);
				return rows;
			},
			listActiveAttempts: async () => [],
			findFeatured: async () => undefined,
			listHistory: async () => [],
			listSubtestScoringInputs: async () => [],
			findFinishedAttemptResult: async () => undefined,
			findAttemptForReview: async () => undefined,
			findSubtestName: async () => undefined,
			listSubtestQuestionRows: async () => [],
			listSubtestsForTryout: async () => subtests,
		};
		const service = createTryoutReadService({ repository, finalizeExpiredAttempt: async () => {} });

		const listed = await service.list({ limit: 20, after: createDateIdCursor(rows[0]!.startsAt, 1) }, caller);

		expect(listed.items.map((item) => [item.id, item.isOpen])).toEqual([
			[1, true],
			[2, false],
			[3, false],
			[4, true],
		]);
		expect(listed.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: true,
			startCursor: createDateIdCursor(rows[0]!.startsAt, 1),
			endCursor: createDateIdCursor(rows[3]!.startsAt, 4),
		});

		await service.list({ level: "tka", category: "smp" }, caller);
		expect(listCalls[1]).toMatchObject({
			userId: caller.id,
			level: "tka",
			category: "smp",
		});
	});
});

describe("active tryouts", () => {
	test("maps ongoing, break, and non-published active attempts", async () => {
		const ongoingDeadline = new Date("2100-01-01T10:00:00Z");
		const breakDeadline = new Date("2100-01-01T10:05:00Z");
		const activeAttempts: ActiveAttemptRow[] = [
			{
				id: 101,
				attemptNumber: 1,
				breakEndsAt: new Date("2100-01-01T09:59:00Z"),
				tryout: {
					id: 1,
					title: "UTBK Ongoing",
					category: "utbk",
					status: "published",
					subtests: [
						{ id: 10, name: "PU", order: 1 },
						{ id: 11, name: "PBM", order: 2 },
					],
				},
				subtestAttempts: [
					{ subtestId: 10, status: "finished", deadline: new Date("2100-01-01T09:30:00Z") },
					{ subtestId: 11, status: "ongoing", deadline: ongoingDeadline },
				],
			},
			{
				id: 102,
				attemptNumber: 2,
				breakEndsAt: breakDeadline,
				tryout: {
					id: 2,
					title: "TKA Break",
					category: "sma",
					status: "published",
					subtests: [
						{ id: 20, name: "Matematika", order: 1 },
						{ id: 21, name: "Fisika", order: 2 },
						{ id: 22, name: "Kimia", order: 3 },
					],
				},
				subtestAttempts: [{ subtestId: 20, status: "finished", deadline: new Date("2100-01-01T09:30:00Z") }],
			},
			{
				id: 103,
				attemptNumber: 1,
				breakEndsAt: null,
				tryout: {
					id: 3,
					title: "Draft Hidden",
					category: "sd",
					status: "draft",
					subtests: [{ id: 30, name: "Sub", order: 1 }],
				},
				subtestAttempts: [{ subtestId: 30, status: "ongoing", deadline: ongoingDeadline }],
			},
			{
				id: 104,
				attemptNumber: 1,
				breakEndsAt: null,
				tryout: null,
				subtestAttempts: [],
			},
			{
				id: 105,
				attemptNumber: 1,
				breakEndsAt: null,
				tryout: {
					id: 5,
					title: "All Finished",
					category: "smp",
					status: "published",
					subtests: [{ id: 50, name: "Only", order: 1 }],
				},
				subtestAttempts: [{ subtestId: 50, status: "finished", deadline: new Date("2100-01-01T09:30:00Z") }],
			},
		];
		const { service } = makeService({ ...baseOverrides(), activeAttempts });

		const result = await service.active(caller);

		expect(result).toEqual([
			{
				id: 1,
				attemptId: 101,
				attemptNumber: 1,
				title: "UTBK Ongoing",
				category: "utbk",
				totalSubtests: 2,
				completedSubtests: 1,
				activeSubtestName: "PBM",
				activeDeadline: ongoingDeadline,
				breakDeadline: null,
			},
			{
				id: 2,
				attemptId: 102,
				attemptNumber: 2,
				title: "TKA Break",
				category: "sma",
				totalSubtests: 3,
				completedSubtests: 1,
				activeSubtestName: "Fisika",
				activeDeadline: null,
				breakDeadline,
			},
			{
				id: 5,
				attemptId: 105,
				attemptNumber: 1,
				title: "All Finished",
				category: "smp",
				totalSubtests: 1,
				completedSubtests: 1,
				activeSubtestName: null,
				activeDeadline: null,
				breakDeadline: null,
			},
		]);
	});
});

describe("history and result", () => {
	test("normalizes history scores and keeps the tryout summary", async () => {
		const historyRow: HistoryRow = {
			id: 8,
			attemptNumber: 1,
			score: "700",
			status: "finished",
			startedAt: new Date(),
			completedAt: new Date(),
			tryout: { id: 1, title: "Tryout", category: "utbk" },
		};
		const { service } = makeService({ ...baseOverrides(), history: [historyRow] });
		const items = await service.history(caller);
		expect(items).toEqual([
			{
				id: 8,
				attemptNumber: 1,
				score: 700,
				maxScore: 0,
				status: "finished",
				startedAt: historyRow.startedAt,
				completedAt: historyRow.completedAt,
				tryout: { id: 1, title: "Tryout", category: "utbk" },
			},
		]);
	});

	test("derives the history max score from the tryout's scoring maps", async () => {
		const historyRow: HistoryRow = {
			id: 8,
			attemptNumber: 1,
			score: "700",
			status: "finished",
			startedAt: new Date(),
			completedAt: new Date(),
			tryout: { id: 1, title: "Tryout", category: "utbk" },
		};
		const { service } = makeService({
			...baseOverrides(),
			history: [historyRow],
			scoringInputs: [
				{ tryoutId: 1, scoringMap: { "10": 800 }, questionCount: 10 },
				{ tryoutId: 2, scoringMap: null, questionCount: 5 },
			],
		});
		const items = await service.history(caller);
		expect(items.map((item) => item.maxScore)).toEqual([800]);
	});

	test("rejects a result that is not the caller's finished attempt", async () => {
		const { service } = makeService({ ...baseOverrides(), result: undefined });
		await expect(service.result({ attemptId: 99 }, caller)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Gagal menemukan pengerjaan tryout.",
		});
	});

	test("normalizes the result scores of the attempt and its subtests", async () => {
		const result: ResultRow = {
			id: 8,
			attemptNumber: 1,
			startedAt: new Date(),
			score: "700",
			deadline: new Date("2100-01-01"),
			completedAt: new Date(),
			status: "finished",
			usedCredit: true,
			usedAccessCode: false,
			tryout: {
				id: 1,
				title: "Tryout",
				category: "utbk",
				passingGrade: 600,
				subtests: [{ id: 10, name: "First", duration: 30 }],
			},
			subtestAttempts: [{ id: 5, subtestId: 10, status: "finished", completedAt: new Date(), score: "800" }],
		};
		const { service } = makeService({
			...baseOverrides(),
			result,
			scoringInputs: [{ tryoutId: 1, scoringMap: { "10": 800 }, questionCount: 10 }],
		});
		const found = await service.result({ attemptId: 8 }, caller);
		expect(found.score).toBe(700);
		expect(found.maxScore).toBe(800);
		expect(found.subtestAttempts).toEqual([
			{
				id: 5,
				subtestId: 10,
				status: "finished",
				completedAt: result.completedAt,
				score: 800,
				correctCount: 0,
				questionCount: 0,
			},
		]);
	});
});

describe("subtest review", () => {
	test("rejects an attempt the caller does not own", async () => {
		const { service } = makeService({ ...baseOverrides(), reviewAttempt: undefined });
		await expect(service.review({ attemptId: 8, subtestId: 10 }, caller)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Gagal menemukan pengerjaan tryout.",
		});
	});

	test("rejects a subtest that is not finished", async () => {
		const { service } = makeService({
			...baseOverrides(),
			reviewAttempt: {
				id: 8,
				attemptNumber: 1,
				subtestAttempts: [subtestAttemptOngoing],
			},
		});
		await expect(service.review({ attemptId: 8, subtestId: 11 }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Subtest belum selesai atau tidak ditemukan.",
		});
	});

	test("always exposes discussions and essay correct answers for finished subtests", async () => {
		const essayRows = [
			{
				questionId: 22,
				questionContent: "Jelaskan!",
				questionContentJson: null,
				questionType: "essay" as const,
				essayCorrectAnswer: "Kunci esai",
				discussion: "Pembahasan esai",
				discussionJson: null,
				choiceId: null,
				choiceContent: null,
				choiceCode: null,
				isCorrectChoice: null,
				userSelectedChoiceId: null,
				userSelectedChoiceIds: null,
				userEssayAnswer: "Jawaban",
				userIsDoubtful: false,
			},
		];
		const free = makeService({
			...baseOverrides(),
			reviewAttempt: {
				id: 8,
				attemptNumber: 1,
				subtestAttempts: [subtestAttemptFinished],
			},
			subtestName: { name: "First" },
			subtestQuestionRows: [[...questionRows, ...essayRows]],
		});
		const result = await free.service.review({ attemptId: 8, subtestId: 10 }, { ...caller, isPremium: false });
		expect(result.questions[0]?.discussion).toEqual({
			type: "doc",
			content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan" }] }],
		});
		expect(result.questions[1]?.discussion).toEqual({
			type: "doc",
			content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan esai" }] }],
		});
		expect(result.questions[1]?.essayCorrectAnswer).toBe("Kunci esai");
		expect(result.subtest).toEqual({ name: "First" });
	});

	test("rejects a removed subtest after the attempt check", async () => {
		const { service } = makeService({
			...baseOverrides(),
			reviewAttempt: {
				id: 8,
				attemptNumber: 1,
				subtestAttempts: [subtestAttemptFinished],
			},
			subtestName: undefined,
		});
		await expect(service.review({ attemptId: 8, subtestId: 10 }, caller)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});
	});
});
