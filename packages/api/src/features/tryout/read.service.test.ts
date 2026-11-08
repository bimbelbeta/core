import { describe, expect, test } from "bun:test";
import type { Session } from "@/context";
import { createIdCursor } from "@/lib/pagination/cursor";
import type { ReadServiceDependencies } from "./read.service";
import { createTryoutReadService } from "./read.service";
import type {
	AttemptWithSubtestAttempts,
	FeaturedTryoutRow,
	HistoryRow,
	MemberTryoutListItem,
	ResultRow,
	ReviewAttemptRow,
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
	startedAt: new Date(),
	deadline: new Date("2100-01-01"),
	completedAt: null,
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
	featured?: FeaturedTryoutRow | undefined;
	history?: HistoryRow[];
	result?: ResultRow | undefined;
	reviewAttempt?: ReviewAttemptRow | undefined;
	subtestName?: { name: string } | undefined;
	rows?: (typeof questionRows)[];
	subtestQuestionRows?: (typeof questionRows)[];
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
		findFeatured: async () => overrides.featured,
		listHistory: async () => overrides.history ?? [],
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

	test("presents an untouched current subtest as ongoing without questions", async () => {
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
			status: "ongoing",
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
				category: "utbk" as const,
				attemptStatus: null,
			},
		];
		const repository = {
			findPublishedTryoutWithSubtests: async () => undefined,
			findAttemptWithSubtestAttempts: async () => undefined,
			listForMember: async () => rows,
			findFeatured: async () => undefined,
			listHistory: async () => [],
			findFinishedAttemptResult: async () => undefined,
			findAttemptForReview: async () => undefined,
			findSubtestName: async () => undefined,
			listSubtestQuestionRows: async () => [],
			listSubtestsForTryout: async () => subtests,
		};
		const service = createTryoutReadService({ repository, finalizeExpiredAttempt: async () => {} });

		const listed = await service.list({ limit: 20, after: createIdCursor(1) }, caller);

		expect(listed.items.map((item) => [item.id, item.isOpen])).toEqual([
			[1, true],
			[2, false],
			[3, false],
			[4, true],
		]);
		expect(listed.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: true,
			startCursor: createIdCursor(1),
			endCursor: createIdCursor(4),
		});
	});
});

describe("history and result", () => {
	test("normalizes history scores and keeps the tryout summary", async () => {
		const historyRow: HistoryRow = {
			id: 8,
			score: "700",
			status: "finished",
			startedAt: new Date(),
			completedAt: new Date(),
			tryout: { id: 1, title: "Tryout" },
		};
		const { service } = makeService({ ...baseOverrides(), history: [historyRow] });
		const items = await service.history(caller);
		expect(items).toEqual([
			{
				id: 8,
				score: 700,
				status: "finished",
				startedAt: historyRow.startedAt,
				completedAt: historyRow.completedAt,
				tryout: { id: 1, title: "Tryout" },
			},
		]);
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
		const { service } = makeService({ ...baseOverrides(), result });
		const found = await service.result({ attemptId: 8 }, caller);
		expect(found.score).toBe(700);
		expect(found.subtestAttempts).toEqual([
			{ id: 5, subtestId: 10, status: "finished", completedAt: result.completedAt, score: 800 },
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
			reviewAttempt: { id: 8, usedCredit: true, usedAccessCode: false, subtestAttempts: [subtestAttemptOngoing] },
		});
		await expect(service.review({ attemptId: 8, subtestId: 11 }, caller)).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Subtest belum selesai atau tidak ditemukan.",
		});
	});

	test("hides discussions without premium, credit, or access code", async () => {
		const premium = { ...caller, isPremium: true };
		const credits = makeService({
			...baseOverrides(),
			reviewAttempt: {
				id: 8,
				usedCredit: true,
				usedAccessCode: false,
				subtestAttempts: [subtestAttemptFinished],
			},
			subtestName: { name: "First" },
		});
		const withCredits = await credits.service.review({ attemptId: 8, subtestId: 10 }, caller);
		expect(withCredits.questions[0]?.discussion).toEqual({
			type: "doc",
			content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan" }] }],
		});
		expect(withCredits.subtest).toEqual({ name: "First" });

		const free = makeService({
			...baseOverrides(),
			reviewAttempt: {
				id: 8,
				usedCredit: false,
				usedAccessCode: false,
				subtestAttempts: [subtestAttemptFinished],
			},
			subtestName: { name: "First" },
		});
		const withoutDiscussion = await free.service.review({ attemptId: 8, subtestId: 10 }, caller);
		expect(withoutDiscussion.questions[0]?.discussion).toBeNull();

		const paidByCode = makeService({
			...baseOverrides(),
			reviewAttempt: {
				id: 8,
				usedCredit: false,
				usedAccessCode: true,
				subtestAttempts: [subtestAttemptFinished],
			},
			subtestName: { name: "First" },
		});
		const withCode = await paidByCode.service.review({ attemptId: 8, subtestId: 10 }, premium);
		expect(withCode.questions[0]?.discussion).toEqual({
			type: "doc",
			content: [{ type: "paragraph", content: [{ type: "text", text: "Pembahasan" }] }],
		});
	});

	test("rejects a removed subtest after the attempt check", async () => {
		const { service } = makeService({
			...baseOverrides(),
			reviewAttempt: { id: 8, usedCredit: true, usedAccessCode: false, subtestAttempts: [subtestAttemptFinished] },
			subtestName: undefined,
		});
		await expect(service.review({ attemptId: 8, subtestId: 10 }, caller)).rejects.toMatchObject({
			code: "NOT_FOUND",
			message: "Subtest tidak ditemukan",
		});
	});
});
