import { defineRelationsPart } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { question, questionChoice } from "./question";

/*
  Tryout & Subtests
 */
export const tryoutCategory = pgEnum("tryout_category", ["sd", "smp", "sma", "utbk"]);
export const tryoutStatus = pgEnum("tryout_status", ["draft", "published", "archived"]);

export const tryout = pgTable("tryout", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: text().notNull(),
	description: text(),
	passingGrade: integer("passing_grade").notNull().default(600),
	category: tryoutCategory("category").notNull().default("utbk"),
	status: tryoutStatus("status").notNull().default("draft"),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const tryoutAccessCode = pgTable(
	"tryout_access_code",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		tryoutId: integer("tryout_id")
			.notNull()
			.references(() => tryout.id, { onDelete: "cascade" }),
		codeHash: text("code_hash").notNull(),
		codePreview: text("code_preview").notNull(),
		label: text(),
		isActive: boolean("is_active").notNull().default(true),
		expiresAt: timestamp("expires_at"),
		maxUses: integer("max_uses"),
		usedCount: integer("used_count").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [
		index("idx_tryout_access_code_tryout_id").on(t.tryoutId),
		unique("uq_tryout_access_code_hash").on(t.tryoutId, t.codeHash),
	],
);

export const tryoutSubtest = pgTable(
	"tryout_subtest",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		tryoutId: integer("tryout_id")
			.notNull()
			.references(() => tryout.id, { onDelete: "cascade" }),
		name: text().notNull(),
		description: text(),
		duration: integer().notNull(),
		questionOrder: text("question_order").notNull().default("sequential"),
		order: integer().notNull().default(1),
		scoringMap: jsonb("scoring_map").$type<Record<string, number>>(),
	},
	(t) => [unique("tryout_subtest_order").on(t.tryoutId, t.order)],
);

/*
  Linking Questions to Subtests
*/
export const tryoutSubtestQuestion = pgTable(
	"tryout_subtest_question",
	{
		subtestId: integer("subtest_id")
			.notNull()
			.references(() => tryoutSubtest.id, { onDelete: "cascade" }),
		questionId: integer("question_id")
			.notNull()
			.references(() => question.id, { onDelete: "cascade" }),
		order: integer().default(1),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.subtestId, t.questionId] })],
);

/*
  Attempts & User Answers
*/
export const tryoutAttemptStatus = pgEnum("tryout_attempt_status", ["not_started", "ongoing", "finished"]);

export const tryoutAttempt = pgTable(
	"tryout_attempt",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "set null" }),
		tryoutId: integer("tryout_id")
			.notNull()
			.references(() => tryout.id, { onDelete: "cascade" }),
		startedAt: timestamp("started_at").notNull().defaultNow(),
		deadline: timestamp("deadline").notNull(),
		completedAt: timestamp("completed_at"),
		status: tryoutAttemptStatus("status").notNull().default("ongoing"),
		score: numeric("score", { precision: 10, scale: 2 }), // Can be calculated later
		submittedImageUrl: text("submitted_image_url"),
		isRevoked: boolean("is_revoked").notNull().default(false),
		usedCredit: boolean("used_credit").notNull().default(false),
		usedAccessCode: boolean("used_access_code").notNull().default(false),
		accessCodeId: integer("access_code_id").references(() => tryoutAccessCode.id, { onDelete: "set null" }),
	},
	(t) => [unique("user_tryout_attempt").on(t.userId, t.tryoutId), index("idx_tryout_attempt_tryout_id").on(t.tryoutId)],
);

export const tryoutSubtestAttempt = pgTable(
	"tryout_subtest_attempt",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		tryoutAttemptId: integer("tryout_attempt_id")
			.notNull()
			.references(() => tryoutAttempt.id, { onDelete: "cascade" }),
		subtestId: integer("subtest_id")
			.notNull()
			.references(() => tryoutSubtest.id, { onDelete: "cascade" }),
		startedAt: timestamp("started_at").notNull().defaultNow(),
		completedAt: timestamp("completed_at"),
		deadline: timestamp("deadline").notNull(),
		status: tryoutAttemptStatus("status").notNull().default("ongoing"),
		score: numeric("score", { precision: 10, scale: 2 }), // Can be calculated later
	},
	(t) => [
		unique("user_tryout_subtest_attempt").on(t.tryoutAttemptId, t.subtestId),
		index("idx_tryout_subtest_attempt_subtest_id").on(t.subtestId),
	],
);

export const tryoutUserAnswer = pgTable(
	"tryout_user_answer",
	{
		attemptId: integer("attempt_id")
			.notNull()
			.references(() => tryoutAttempt.id, { onDelete: "cascade" }),
		questionId: integer("question_id")
			.notNull()
			.references(() => question.id, { onDelete: "cascade" }),
		selectedChoiceId: integer("selected_choice_id").references(() => questionChoice.id, { onDelete: "set null" }),
		selectedChoiceIds: integer("selected_choice_ids").array(),
		essayAnswer: text("essay_answer"),
		isDoubtful: boolean("is_doubtful").notNull().default(false),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.attemptId, t.questionId] })],
);

export const tryoutRelations = defineRelationsPart(
	{
		tryout,
		tryoutAccessCode,
		tryoutSubtest,
		tryoutSubtestQuestion,
		tryoutAttempt,
		tryoutSubtestAttempt,
		tryoutUserAnswer,
		user,
		question,
		questionChoice,
	},
	(r) => ({
		tryout: {
			subtests: r.many.tryoutSubtest({
				from: r.tryout.id,
				to: r.tryoutSubtest.tryoutId,
			}),
			attempts: r.many.tryoutAttempt({
				from: r.tryout.id,
				to: r.tryoutAttempt.tryoutId,
			}),
			accessCodes: r.many.tryoutAccessCode({
				from: r.tryout.id,
				to: r.tryoutAccessCode.tryoutId,
			}),
		},
		tryoutAccessCode: {
			tryout: r.one.tryout({
				from: r.tryoutAccessCode.tryoutId,
				to: r.tryout.id,
			}),
			attempts: r.many.tryoutAttempt({
				from: r.tryoutAccessCode.id,
				to: r.tryoutAttempt.accessCodeId,
			}),
		},
		tryoutSubtest: {
			tryout: r.one.tryout({
				from: r.tryoutSubtest.tryoutId,
				to: r.tryout.id,
			}),
			questions: r.many.tryoutSubtestQuestion({
				from: r.tryoutSubtest.id,
				to: r.tryoutSubtestQuestion.subtestId,
			}),
		},
		tryoutSubtestQuestion: {
			subtest: r.one.tryoutSubtest({
				from: r.tryoutSubtestQuestion.subtestId,
				to: r.tryoutSubtest.id,
			}),
			question: r.one.question({
				from: r.tryoutSubtestQuestion.questionId,
				to: r.question.id,
			}),
		},
		tryoutAttempt: {
			tryout: r.one.tryout({
				from: r.tryoutAttempt.tryoutId,
				to: r.tryout.id,
			}),
			user: r.one.user({
				from: r.tryoutAttempt.userId,
				to: r.user.id,
			}),
			accessCode: r.one.tryoutAccessCode({
				from: r.tryoutAttempt.accessCodeId,
				to: r.tryoutAccessCode.id,
			}),
			subtestAttempts: r.many.tryoutSubtestAttempt({
				from: r.tryoutAttempt.id,
				to: r.tryoutSubtestAttempt.tryoutAttemptId,
			}),
			userAnswers: r.many.tryoutUserAnswer({
				from: r.tryoutAttempt.id,
				to: r.tryoutUserAnswer.attemptId,
			}),
		},
		tryoutSubtestAttempt: {
			tryoutAttempt: r.one.tryoutAttempt({
				from: r.tryoutSubtestAttempt.tryoutAttemptId,
				to: r.tryoutAttempt.id,
			}),
			subtest: r.one.tryoutSubtest({
				from: r.tryoutSubtestAttempt.subtestId,
				to: r.tryoutSubtest.id,
			}),
		},
		tryoutUserAnswer: {
			attempt: r.one.tryoutAttempt({
				from: r.tryoutUserAnswer.attemptId,
				to: r.tryoutAttempt.id,
			}),
			question: r.one.question({
				from: r.tryoutUserAnswer.questionId,
				to: r.question.id,
			}),
			selectedChoice: r.one.questionChoice({
				from: r.tryoutUserAnswer.selectedChoiceId,
				to: r.questionChoice.id,
			}),
		},
	}),
);
