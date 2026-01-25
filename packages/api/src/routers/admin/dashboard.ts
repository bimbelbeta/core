import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { subject } from "@bimbelbeta/db/schema/subject";
import { transaction } from "@bimbelbeta/db/schema/transaction";
import { tryout, tryoutAttempt } from "@bimbelbeta/db/schema/tryout";
import { type } from "arktype";
import { and, asc, count, desc, eq, gt, gte, ilike, lt, or, sql } from "drizzle-orm";
import { admin } from "../../index";

const stats = admin
	.route({
		path: "/admin/dashboard/stats",
		method: "GET",
		tags: ["Admin - Dashboard"],
	})
	.output(
		type({
			totalUsers: "number",
			premiumUsers: "number",
			activeSubjects: "number",
			monthlyRevenue: "number",
			usersTrend: "number",
			premiumTrend: "number",
			subjectsTrend: "number",
			revenueTrend: "number",
		}),
	)
	.handler(async () => {
		const now = new Date();
		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

		const currentUsers = await db.select({ count: count() }).from(user);

		const currentPremium = await db.select({ count: count() }).from(user).where(eq(user.isPremium, true));

		const currentSubjects = await db.select({ count: count() }).from(subject);

		const currentRevenue = await db
			.select({ total: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)` })
			.from(transaction)
			.where(and(eq(transaction.status, "success"), gte(transaction.paidAt, currentMonthStart)));

		const lastMonthUsers = await db.select({ count: count() }).from(user).where(gte(user.createdAt, lastMonthStart));

		const lastMonthPremium = await db
			.select({ count: count() })
			.from(user)
			.where(and(eq(user.isPremium, true), gte(user.premiumExpiresAt, lastMonthStart)));

		const lastMonthSubjects = await db
			.select({ count: count() })
			.from(subject)
			.where(gte(subject.createdAt, lastMonthStart));

		const lastMonthRevenue = await db
			.select({ total: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)` })
			.from(transaction)
			.where(
				and(
					eq(transaction.status, "success"),
					gte(transaction.paidAt, new Date(now.getFullYear(), now.getMonth() - 2, 1)),
				),
			);

		return {
			totalUsers: currentUsers[0]?.count ?? 0,
			premiumUsers: currentPremium[0]?.count ?? 0,
			activeSubjects: currentSubjects[0]?.count ?? 0,
			monthlyRevenue: currentRevenue[0]?.total ?? 0,
			usersTrend:
				(lastMonthUsers[0]?.count ?? 0) > 0
					? ((currentUsers[0]?.count ?? 0 - lastMonthUsers[0]!.count) / lastMonthUsers[0]!.count) * 100
					: 0,
			premiumTrend:
				(lastMonthPremium[0]?.count ?? 0) > 0
					? ((currentPremium[0]?.count ?? 0 - lastMonthPremium[0]!.count) / lastMonthPremium[0]!.count) * 100
					: 0,
			subjectsTrend:
				(lastMonthSubjects[0]?.count ?? 0) > 0
					? ((currentSubjects[0]?.count ?? 0 - lastMonthSubjects[0]!.count) / lastMonthSubjects[0]!.count) * 100
					: 0,
			revenueTrend:
				(lastMonthRevenue[0]?.total ?? 0) > 0
					? ((currentRevenue[0]?.total ?? 0 - lastMonthRevenue[0]!.total) / lastMonthRevenue[0]!.total) * 100
					: 0,
		};
	});

const recentActivity = admin
	.route({
		path: "/admin/dashboard/activity",
		method: "GET",
		tags: ["Admin - Dashboard"],
	})
	.input(
		type({
			search: "string?",
			type: '"user" | "premium" | "subject" | "tryout"?',
			limit: "number = 10",
			cursor: "string?",
			direction: '"next" | "previous" = "next"',
		}),
	)
	.output(
		type({
			data: type({
				id: "number",
				type: '"user" | "premium" | "subject" | "tryout"',
				description: "string",
				userName: "string",
				date: "string",
			}).array(),
			nextCursor: "string?",
		}),
	)
	.handler(async ({ input }) => {
		const limit = Math.min(input.limit, 100);
		const isNext = input.direction === "next";
		const orderFn = isNext ? desc : asc;
		const cursorDate = input.cursor ? new Date(input.cursor) : undefined;

		const userActivities = await db
			.select({
				id: sql<number>`hashtext(${user.id})`.as("id"),
				type: sql<string>`'user'`.as("type"),
				description: sql<string>`CONCAT(${user.name}, ' bergabung')`.as("description"),
				userName: user.name,
				date: user.createdAt,
			})
			.from(user)
			.where(
				and(
					cursorDate ? (isNext ? lt(user.createdAt, cursorDate) : gt(user.createdAt, cursorDate)) : undefined,
					input.search ? ilike(user.name, `%${input.search}%`) : undefined,
				),
			)
			.orderBy(orderFn(user.createdAt))
			.limit(limit * 4 + 10);

		const premiumActivities = await db
			.select({
				id: sql<number>`hashtext(COALESCE(${transaction.id}, '')) + 1`.as("id"),
				type: sql<string>`'premium'`.as("type"),
				description: sql<string>`'Pengguna membeli premium'`.as("description"),
				userName: user.name,
				date: transaction.paidAt,
			})
			.from(transaction)
			.innerJoin(user, eq(transaction.userId, user.id))
			.where(
				and(
					eq(transaction.status, "success"),
					cursorDate ? (isNext ? lt(transaction.paidAt, cursorDate) : gt(transaction.paidAt, cursorDate)) : undefined,
					input.search ? ilike(user.name, `%${input.search}%`) : undefined,
				),
			)
			.orderBy(orderFn(transaction.paidAt))
			.limit(limit * 4 + 10);

		const subjectActivities = await db
			.select({
				id: sql<number>`(${subject.id} * 10000 + 2)`.as("id"),
				type: sql<string>`'subject'`.as("type"),
				description: sql<string>`CONCAT('Mata pelajaran ', ${subject.name}, ' dibuat')`.as("description"),
				userName: sql<string>`'Admin'`.as("userName"),
				date: subject.createdAt,
			})
			.from(subject)
			.where(
				and(
					cursorDate ? (isNext ? lt(subject.createdAt, cursorDate) : gt(subject.createdAt, cursorDate)) : undefined,
					input.search ? ilike(subject.name, `%${input.search}%`) : undefined,
				),
			)
			.orderBy(orderFn(subject.createdAt))
			.limit(limit * 4 + 10);

		const tryoutActivities = await db
			.select({
				id: sql<number>`(${tryoutAttempt.id} * 10000 + 3)`.as("id"),
				type: sql<string>`'tryout'`.as("type"),
				description: sql<string>`CONCAT(${user.name}, ' memulai tryout ', ${tryout.title})`.as("description"),
				userName: user.name,
				date: tryoutAttempt.startedAt,
			})
			.from(tryoutAttempt)
			.innerJoin(user, eq(tryoutAttempt.userId, user.id))
			.innerJoin(tryout, eq(tryoutAttempt.tryoutId, tryout.id))
			.where(
				and(
					cursorDate
						? isNext
							? lt(tryoutAttempt.startedAt, cursorDate)
							: gt(tryoutAttempt.startedAt, cursorDate)
						: undefined,
					input.search
						? sql`${or(ilike(user.name, `%${input.search}%`), ilike(tryout.title, `%${input.search}%`))}`
						: undefined,
				),
			)
			.orderBy(orderFn(tryoutAttempt.startedAt))
			.limit(limit * 4 + 10);

		const allActivities = [...userActivities, ...premiumActivities, ...subjectActivities, ...tryoutActivities]
			.filter((a) => a.date !== null)
			.map((a) => ({ ...a, date: new Date(a.date!).toISOString() }))
			.sort((a, b) => {
				const aTime = new Date(a.date!).getTime();
				const bTime = new Date(b.date!).getTime();
				return isNext ? bTime - aTime : aTime - bTime;
			});

		const filteredActivities = input.type ? allActivities.filter((a) => a.type === input.type) : allActivities;

		const hasMore = filteredActivities.length > limit;
		const data = hasMore ? filteredActivities.slice(0, limit) : filteredActivities;
		const nextCursor = hasMore ? data[data.length - 1]!.date : null;

		return {
			data: data as Array<{
				id: number;
				type: "user" | "premium" | "subject" | "tryout";
				description: string;
				userName: string;
				date: string;
			}>,
			nextCursor: (nextCursor as string | null) ?? undefined,
		};
	});

const analytics = admin
	.route({
		path: "/admin/dashboard/analytics",
		method: "GET",
		tags: ["Admin - Dashboard"],
	})
	.input(type({ days: "number" }))
	.output(
		type({
			revenueData: type({
				date: "string",
				value: "number",
			}).array(),
		}),
	)
	.handler(async ({ input }) => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - input.days);

		const results = await db
			.select({
				date: transaction.paidAt,
				value: sql<number>`COALESCE(CAST(SUM(${transaction.grossAmount}) AS FLOAT), 0)`.as("value"),
			})
			.from(transaction)
			.where(and(eq(transaction.status, "success"), gte(transaction.paidAt, startDate)))
			.groupBy(transaction.paidAt)
			.orderBy(transaction.paidAt);

		return {
			revenueData: results
				.filter((r) => r.date !== null)
				.map((r) => ({ date: new Date(r.date!).toISOString(), value: r.value })),
		};
	});

export const adminDashboardRouter = {
	stats,
	recentActivity,
	analytics,
};
