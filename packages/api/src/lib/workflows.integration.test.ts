import { afterAll, beforeAll, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { creditTransaction } from "@bimbelbeta/db/schema/credit";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import { contentItem, contentPracticeQuestions, noteMaterial, subject } from "@bimbelbeta/db/schema/subject";
import { product, transaction } from "@bimbelbeta/db/schema/transaction";
import {
	tryout,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "@bimbelbeta/db/schema/tryout";
import { call } from "@orpc/server";
import { eq } from "drizzle-orm";
import { Snap } from "midtrans-client";
import { paymentRepository } from "@/lib/transactions/repository";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const id = `integration-${crypto.randomUUID()}`;
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
};
const options = { context: { session } };
let subjectId = 0;
let tryoutId = 0;
const extraTryouts: number[] = [];
const products: string[] = [];
let questionId = 0;
const originalServerKey = process.env.MIDTRANS_SERVER_KEY;

function restoreEnv(key: string, value: string | undefined) {
	if (value === undefined) delete process.env[key];
	else process.env[key] = value;
}

describe.skipIf(!enabled)("API persistence workflows", () => {
	beforeAll(async () => {
		process.env.MIDTRANS_SERVER_KEY = "test-server-key";
		await db.insert(user).values({ id, name: id, email: session.user.email, role: "admin", tryoutCredits: 1 });
		const [createdSubject] = await db.insert(subject).values({ name: id, shortName: id }).returning();
		subjectId = createdSubject!.id;
	});

	beforeEach(async () => {
		await db.delete(creditTransaction).where(eq(creditTransaction.userId, id));
		await db.delete(transaction).where(eq(transaction.userId, id));
		await db.update(user).set({ tryoutCredits: 1, isPremium: false }).where(eq(user.id, id));
	});

	afterAll(async () => {
		if (tryoutId) await db.delete(tryout).where(eq(tryout.id, tryoutId));
		for (const extraId of extraTryouts) await db.delete(tryout).where(eq(tryout.id, extraId));
		await db.delete(transaction).where(eq(transaction.userId, id));
		for (const productId of products) await db.delete(product).where(eq(product.id, productId));
		if (subjectId) await db.delete(subject).where(eq(subject.id, subjectId));
		if (questionId) await db.delete(question).where(eq(question.id, questionId));
		await db.delete(user).where(eq(user.id, id));
		restoreEnv("MIDTRANS_SERVER_KEY", originalServerKey);
	});

	test("writes content and question data, rolls back failures, and completes a scored tryout", async () => {
		const created = await call(
			appRouter.admin.tryout.questions.create,
			{
				type: "multiple_choice",
				content: "Question",
				discussion: "Discussion",
				choices: [
					{ content: "Correct", isCorrect: true },
					{ content: "Wrong", isCorrect: false },
				],
			},
			options,
		);
		questionId = created.id;
		const choices = await db.select().from(questionChoice).where(eq(questionChoice.questionId, questionId));
		expect(choices).toHaveLength(2);
		await expect(
			call(
				appRouter.admin.tryout.questions.create,
				{
					type: "multiple_choice",
					content: id,
					discussion: "Rollback",
					choices: Array.from({ length: 8 }, (_, index) => ({ content: `Choice ${index}`, isCorrect: index === 0 })),
				},
				options,
			),
		).rejects.toThrow();
		expect(await db.select().from(question).where(eq(question.content, id))).toHaveLength(0);
		const correct = choices.find((item) => item.isCorrect)!;

		const content = await call(
			appRouter.admin.content.create,
			{
				subjectId,
				title: "Content",
				order: 1,
				note: { content: { type: "doc", content: [] } },
				practiceQuestionIds: [questionId],
			},
			options,
		);
		expect(content.createdMaterials.practiceQuestions).toBe(1);
		expect(await db.select().from(noteMaterial).where(eq(noteMaterial.contentItemId, content.contentId))).toHaveLength(
			1,
		);
		expect(
			await db
				.select()
				.from(contentPracticeQuestions)
				.where(eq(contentPracticeQuestions.contentItemId, content.contentId)),
		).toHaveLength(1);

		await expect(
			call(
				appRouter.admin.content.create,
				{
					subjectId,
					title: "Rollback",
					order: 2,
					practiceQuestionIds: [2147483647],
				},
				options,
			),
		).rejects.toThrow();
		expect(await db.select().from(contentItem).where(eq(contentItem.title, "Rollback"))).toHaveLength(0);

		const [createdTryout] = await db.insert(tryout).values({ title: id, status: "published" }).returning();
		tryoutId = createdTryout!.id;
		const subtests = await db
			.insert(tryoutSubtest)
			.values([
				{ tryoutId, name: "First", order: 1, duration: 30 },
				{ tryoutId, name: "Second", order: 2, duration: 30 },
			])
			.returning();
		await db.insert(tryoutSubtestQuestion).values({ subtestId: subtests[0]!.id, questionId, order: 1 });
		const started = await call(appRouter.tryout.start, { id: tryoutId, useCredit: true }, options);
		expect(started.usedCredit).toBe(true);
		expect((await db.select().from(user).where(eq(user.id, id)))[0]!.tryoutCredits).toBe(0);
		expect(await db.select().from(creditTransaction).where(eq(creditTransaction.userId, id))).toHaveLength(1);
		expect(
			await db.select().from(tryoutSubtestAttempt).where(eq(tryoutSubtestAttempt.tryoutAttemptId, started.id)),
		).toHaveLength(1);

		await call(
			appRouter.tryout.saveAnswer,
			{ tryoutId, questionId, answerType: "choice", selectedChoiceId: correct.id },
			options,
		);
		expect(await db.select().from(tryoutUserAnswer).where(eq(tryoutUserAnswer.attemptId, started.id))).toHaveLength(1);
		await db.insert(tryoutSubtestAttempt).values({
			tryoutAttemptId: started.id,
			subtestId: subtests[1]!.id,
			deadline: started.deadline,
		});
		const errorLog = spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(
				call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: subtests[0]!.id }, options),
			).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
		} finally {
			errorLog.mockRestore();
		}
		const attemptsAfterFailure = await db
			.select()
			.from(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.tryoutAttemptId, started.id));
		expect(attemptsAfterFailure.find((item) => item.subtestId === subtests[0]!.id)?.status).toBe("ongoing");
		await db
			.delete(tryoutSubtestAttempt)
			.where(eq(tryoutSubtestAttempt.id, attemptsAfterFailure.find((item) => item.subtestId === subtests[1]!.id)!.id));
		expect(await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: subtests[0]!.id }, options)).toMatchObject(
			{ tryoutCompleted: false, nextSubtestId: subtests[1]!.id },
		);
		expect(await call(appRouter.tryout.submitSubtest, { tryoutId, subtestId: subtests[1]!.id }, options)).toMatchObject(
			{ tryoutCompleted: true, score: 1000 },
		);
		const finished = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, started.id));
		expect(finished[0]!.status).toBe("finished");
		expect(Number(finished[0]!.score)).toBe(1000);
	});

	test("finalizes expired attempts and directly submitted tryouts", async () => {
		const [expiredTryout] = await db
			.insert(tryout)
			.values({ title: `${id}-expired`, status: "published" })
			.returning();
		extraTryouts.push(expiredTryout!.id);
		const [expiredSubtest] = await db
			.insert(tryoutSubtest)
			.values({ tryoutId: expiredTryout!.id, name: "Expired", duration: 30 })
			.returning();
		const past = new Date("2020-01-01");
		const [expiredAttempt] = await db
			.insert(tryoutAttempt)
			.values({ tryoutId: expiredTryout!.id, userId: id, deadline: past })
			.returning();
		await db
			.insert(tryoutSubtestAttempt)
			.values({ tryoutAttemptId: expiredAttempt!.id, subtestId: expiredSubtest!.id, deadline: past });
		const found = await call(appRouter.tryout.find, { id: expiredTryout!.id }, options);
		expect(found.attempt.status).toBe("finished");
		const [savedExpired] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, expiredAttempt!.id));
		expect(savedExpired!.status).toBe("finished");
		expect(Number(savedExpired!.score)).toBe(0);

		const [directTryout] = await db
			.insert(tryout)
			.values({ title: `${id}-direct`, status: "published" })
			.returning();
		extraTryouts.push(directTryout!.id);
		const [directAttempt] = await db
			.insert(tryoutAttempt)
			.values({ tryoutId: directTryout!.id, userId: id, deadline: new Date("2100-01-01") })
			.returning();
		expect(await call(appRouter.tryout.submitTryout, { tryoutId: directTryout!.id }, options)).toEqual({
			success: true,
			score: 0,
		});
		const [savedDirect] = await db.select().from(tryoutAttempt).where(eq(tryoutAttempt.id, directAttempt!.id));
		expect(savedDirect!.status).toBe("finished");
		expect(Number(savedDirect!.score)).toBe(0);
	});

	test("persists payment failures, processes notifications once, and rolls back failed benefits", async () => {
		const [plan] = await db
			.insert(product)
			.values({
				name: "Credits",
				slug: `${id}-credits`,
				price: "10000",
				type: "product",
				variant: "credits",
				credits: 5,
			})
			.returning();
		products.push(plan!.id);
		const snap = spyOn(Snap.prototype, "createTransaction").mockRejectedValue(new Error("Midtrans unavailable"));
		const response = () =>
			new Response(JSON.stringify({ transaction_status: "settlement", fraud_status: "accept" }), { status: 200 });
		const fetchStatus = spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(response())
			.mockResolvedValueOnce(response())
			.mockResolvedValueOnce(response());
		try {
			await expect(call(appRouter.transaction.subscribe, { slug: plan!.slug }, options)).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
				message: "Gagal memproses pembayaran. Silahkan coba lagi.",
			});
			const [pending] = await db.select().from(transaction).where(eq(transaction.productId, plan!.id));
			expect(pending!.status).toBe("pending");
			const notify = (orderId: string) => {
				const statusCode = "200";
				const amount = "10000";
				const signature = createHash("sha512")
					.update(`${orderId}${statusCode}${amount}${process.env.MIDTRANS_SERVER_KEY}`)
					.digest("hex");
				return call(
					appRouter.transaction.notification,
					{
						order_id: orderId,
						status_code: statusCode,
						gross_amount: amount,
						signature_key: signature,
					},
					{ context: { session: null } },
				);
			};
			await db.update(user).set({ tryoutCredits: 0 }).where(eq(user.id, id));
			expect(await notify(pending!.id)).toEqual({ status: "ok" });
			expect(await notify(pending!.id)).toEqual({ status: "already_processed" });
			expect((await db.select().from(user).where(eq(user.id, id)))[0]!.tryoutCredits).toBe(5);
			const ledger = await db.select().from(creditTransaction).where(eq(creditTransaction.transactionId, pending!.id));
			expect(ledger).toHaveLength(1);
			const [paid] = await db.select().from(transaction).where(eq(transaction.id, pending!.id));
			expect(paid!.status).toBe("success");

			const failedId = `${id}-payment-rollback`;
			await db.insert(transaction).values({ id: failedId, userId: id, productId: plan!.id, grossAmount: "10000" });
			await db.update(user).set({ tryoutCredits: 2147483647 }).where(eq(user.id, id));
			await expect(notify(failedId)).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
				message: "Gagal memproses transaksi.",
			});
			const [failed] = await db.select().from(transaction).where(eq(transaction.id, failedId));
			expect(failed!.status).toBe("pending");
			expect(failed!.paidAt).toBeNull();
			expect((await db.select().from(user).where(eq(user.id, id)))[0]!.tryoutCredits).toBe(2147483647);
			expect(
				await db.select().from(creditTransaction).where(eq(creditTransaction.transactionId, failedId)),
			).toHaveLength(0);
		} finally {
			snap.mockRestore();
			fetchStatus.mockRestore();
		}
	});

	test("grants benefits once when two notifications arrive together", async () => {
		const [plan] = await db
			.insert(product)
			.values({
				name: "Concurrent",
				slug: `${id}-concurrent`,
				price: "10000",
				type: "product",
				variant: "credits",
				credits: 5,
			})
			.returning();
		products.push(plan!.id);
		const orderId = `${id}-concurrent-order`;
		await db.insert(transaction).values({ id: orderId, userId: id, productId: plan!.id, grossAmount: "10000" });
		await db.update(user).set({ tryoutCredits: 0 }).where(eq(user.id, id));

		let arrived = 0;
		let release = () => {};
		const bothArrived = new Promise<void>((resolve) => {
			release = resolve;
		});
		const gated = Object.assign(
			async () => {
				if (++arrived === 2) release();
				await bothArrived;
				return new Response(JSON.stringify({ transaction_status: "settlement", fraud_status: "accept" }), {
					status: 200,
				});
			},
			{ preconnect: () => {} },
		);
		const fetchStatus = spyOn(globalThis, "fetch").mockImplementation(gated);
		try {
			const signature = createHash("sha512")
				.update(`${orderId}20010000${process.env.MIDTRANS_SERVER_KEY}`)
				.digest("hex");
			const notify = () =>
				call(
					appRouter.transaction.notification,
					{ order_id: orderId, status_code: "200", gross_amount: "10000", signature_key: signature },
					{ context: { session: null } },
				);
			const results = await Promise.all([notify(), notify()]);
			expect(results.map((result) => result.status).sort()).toEqual(["already_processed", "ok"]);
			expect((await db.select().from(user).where(eq(user.id, id)))[0]!.tryoutCredits).toBe(5);
			expect(
				await db.select().from(creditTransaction).where(eq(creditTransaction.transactionId, orderId)),
			).toHaveLength(1);
		} finally {
			fetchStatus.mockRestore();
		}
	});

	test("keeps a claimed order paid and reads a transaction with its product", async () => {
		const [plan] = await db
			.insert(product)
			.values({
				name: "Guard",
				slug: `${id}-guard`,
				price: "10000",
				type: "product",
				variant: "credits",
				credits: 5,
			})
			.returning();
		products.push(plan!.id);
		const claimed = `${id}-claimed`;
		const unsettled = `${id}-unsettled`;
		await db.insert(transaction).values([
			{ id: claimed, userId: id, productId: plan!.id, grossAmount: "10000", status: "success", paidAt: new Date() },
			{ id: unsettled, userId: id, productId: plan!.id, grossAmount: "10000" },
		]);

		await paymentRepository.updateStatus(claimed, "failed");
		await paymentRepository.updateStatus(unsettled, "failed");

		expect((await db.select().from(transaction).where(eq(transaction.id, claimed)))[0]!.status).toBe("success");
		expect((await db.select().from(transaction).where(eq(transaction.id, unsettled)))[0]!.status).toBe("failed");

		expect(await paymentRepository.findTransactionWithProduct(claimed)).not.toBeNull();
	});

	test("downgrades an expired premium session on an authenticated read", async () => {
		await db
			.update(user)
			.set({ isPremium: true, premiumExpiresAt: new Date("2020-01-01") })
			.where(eq(user.id, id));

		const expiredSession = {
			...session,
			user: { ...session.user, isPremium: true, premiumExpiresAt: new Date("2020-01-01") },
		};
		await call(appRouter.tryout.history, undefined, { context: { session: expiredSession } });

		const [after] = await db.select().from(user).where(eq(user.id, id));
		expect(after!.isPremium).toBe(false);
	});

	test("lets a lapsed member start a new checkout", async () => {
		const [plan] = await db
			.insert(product)
			.values({
				name: "Renewal",
				slug: `${id}-renewal`,
				price: "10000",
				type: "subscription",
				variant: "monthly",
				durationDays: 30,
			})
			.returning();
		products.push(plan!.id);
		const expiredAt = new Date("2020-01-01");
		await db.update(user).set({ isPremium: true, premiumExpiresAt: expiredAt }).where(eq(user.id, id));

		const snap = spyOn(Snap.prototype, "createTransaction").mockResolvedValue({
			token: "renewal-token",
			redirect_url: "https://example.test/pay",
		});
		try {
			const expiredSession = {
				...session,
				user: { ...session.user, isPremium: true, premiumExpiresAt: expiredAt },
			};
			const checkout = await call(
				appRouter.transaction.subscribe,
				{ slug: plan!.slug },
				{ context: { session: expiredSession } },
			);
			expect(checkout).toMatchObject({ provider: "midtrans", token: "renewal-token" });
		} finally {
			snap.mockRestore();
		}

		const [after] = await db.select().from(user).where(eq(user.id, id));
		expect(after!.isPremium).toBe(false);
	});

	test("rejects unauthenticated and unauthorized callers", async () => {
		await expect(call(appRouter.tryout.start, { id: 1 }, { context: { session: null } })).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
		await expect(
			call(
				appRouter.admin.content.create,
				{ subjectId, title: "Denied", order: 10, note: { content: {} } },
				{ context: { session: { ...session, user: { ...session.user, role: "user" } } } },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});
