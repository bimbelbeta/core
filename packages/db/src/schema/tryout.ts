import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";
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
	category: tryoutCategory("category").notNull().default("utbk"),
	duration: integer().notNull(), // total duration in minutes
	status: tryoutStatus("status").notNull().default("draft"),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const tryoutRelations = relations(tryout, ({ many }) => ({
	subtests: many(tryoutSubtest),
	attempts: many(tryoutAttempt),
}));

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
		questionOrder: text("question_order").notNull().default("sequential"), // "random" | "sequential"
		order: integer().notNull().default(1),
	},
	(t) => [unique("tryout_subtest_order").on(t.tryoutId, t.order)],
);

export const tryoutSubtestRelations = relations(tryoutSubtest, ({ one, many }) => ({
	tryout: one(tryout, {
		fields: [tryoutSubtest.tryoutId],
		references: [tryout.id],
	}),
	questions: many(tryoutSubtestQuestion),
}));

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
	},
	(t) => [primaryKey({ columns: [t.subtestId, t.questionId] })],
);

export const tryoutSubtestQuestionRelations = relations(tryoutSubtestQuestion, ({ one }) => ({
	subtest: one(tryoutSubtest, {
		fields: [tryoutSubtestQuestion.subtestId],
		references: [tryoutSubtest.id],
	}),
	question: one(question, {
		fields: [tryoutSubtestQuestion.questionId],
		references: [question.id],
	}),
}));

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
		score: integer("score"), // Can be calculated later
		submittedImageUrl: text("submitted_image_url"),
		isRevoked: boolean("is_revoked").notNull().default(false),
	},
	(t) => [unique("user_tryout_attempt").on(t.userId, t.tryoutId)],
);

export const tryoutAttemptRelations = relations(tryoutAttempt, ({ one, many }) => ({
	tryout: one(tryout, {
		fields: [tryoutAttempt.tryoutId],
		references: [tryout.id],
	}),
	user: one(user, {
		fields: [tryoutAttempt.userId],
		references: [user.id],
	}),
	subtestAttempts: many(tryoutSubtestAttempt),
	userAnswers: many(tryoutUserAnswer),
}));

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
	},
	(t) => [unique("user_tryout_subtest_attempt").on(t.tryoutAttemptId, t.subtestId)],
);

export const tryoutSubtestAttemptRelations = relations(tryoutSubtestAttempt, ({ one }) => ({
	tryoutAttempt: one(tryoutAttempt, {
		fields: [tryoutSubtestAttempt.tryoutAttemptId],
		references: [tryoutAttempt.id],
	}),
	subtest: one(tryoutSubtest, {
		fields: [tryoutSubtestAttempt.subtestId],
		references: [tryoutSubtest.id],
	}),
}));

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
		essayAnswer: text("essay_answer"),
		isDoubtful: boolean("is_doubtful").notNull().default(false),
	},
	(t) => [primaryKey({ columns: [t.attemptId, t.questionId] })],
);

export const tryoutUserAnswerRelations = relations(tryoutUserAnswer, ({ one }) => ({
	attempt: one(tryoutAttempt, {
		fields: [tryoutUserAnswer.attemptId],
		references: [tryoutAttempt.id],
	}),
	question: one(question, {
		fields: [tryoutUserAnswer.questionId],
		references: [question.id],
	}),
	selectedChoice: one(questionChoice, {
		fields: [tryoutUserAnswer.selectedChoiceId],
		references: [questionChoice.id],
	}),
}));
