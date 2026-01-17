import { relations } from "drizzle-orm";
import {
	boolean,
	char,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/*
  Tryout & Subtests
*/
export const tryout = pgTable("tryout", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	title: text().notNull(),
	description: text(),
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
  Questions & Answers
*/
export const tryoutQuestionType = pgEnum("tryout_question_type", ["multiple_choice", "essay"]);

export const tryoutQuestion = pgTable("tryout_question", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	type: tryoutQuestionType("type").notNull().default("multiple_choice"),
	content: text("content").notNull(),
	discussion: text("discussion"),
	contentJson: jsonb("content_json"),
	discussionJson: jsonb("discussion_json"),
});

export const tryoutQuestionRelations = relations(tryoutQuestion, ({ many }) => ({
	choices: many(tryoutQuestionChoice),
	subtests: many(tryoutSubtestQuestion),
}));

export const tryoutQuestionChoice = pgTable(
	"tryout_question_choice",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		questionId: integer("question_id")
			.notNull()
			.references(() => tryoutQuestion.id, { onDelete: "cascade" }),
		code: char({ length: 1 }).notNull(), // A, B, C...
		content: text().notNull(),
		contentJson: jsonb("content_json"),
		isCorrect: boolean("is_correct").notNull().default(false),
	},
	(t) => [unique("tryout_question_choice_unique").on(t.questionId, t.code)],
);

export const tryoutQuestionChoiceRelations = relations(tryoutQuestionChoice, ({ one }) => ({
	question: one(tryoutQuestion, {
		fields: [tryoutQuestionChoice.questionId],
		references: [tryoutQuestion.id],
	}),
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
			.references(() => tryoutQuestion.id, { onDelete: "cascade" }),
		order: integer().default(1),
	},
	(t) => [primaryKey({ columns: [t.subtestId, t.questionId] })],
);

export const tryoutSubtestQuestionRelations = relations(tryoutSubtestQuestion, ({ one }) => ({
	subtest: one(tryoutSubtest, {
		fields: [tryoutSubtestQuestion.subtestId],
		references: [tryoutSubtest.id],
	}),
	question: one(tryoutQuestion, {
		fields: [tryoutSubtestQuestion.questionId],
		references: [tryoutQuestion.id],
	}),
}));

/*
  Attempts & User Answers
*/
export const tryoutStatus = pgEnum("tryout_status", ["not_started", "ongoing", "finished"]);

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
		completedAt: timestamp("completed_at"),
		status: tryoutStatus("status").notNull().default("ongoing"),
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
		status: tryoutStatus("status").notNull().default("ongoing"),
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
			.references(() => tryoutQuestion.id, { onDelete: "cascade" }),
		selectedChoiceId: integer("selected_choice_id").references(() => tryoutQuestionChoice.id, { onDelete: "set null" }),
		essayAnswer: text("essay_answer"),
		essayAnswerJson: jsonb("essay_answer_json"),
	},
	(t) => [primaryKey({ columns: [t.attemptId, t.questionId] })],
);

export const tryoutUserAnswerRelations = relations(tryoutUserAnswer, ({ one }) => ({
	attempt: one(tryoutAttempt, {
		fields: [tryoutUserAnswer.attemptId],
		references: [tryoutAttempt.id],
	}),
	question: one(tryoutQuestion, {
		fields: [tryoutUserAnswer.questionId],
		references: [tryoutQuestion.id],
	}),
	selectedChoice: one(tryoutQuestionChoice, {
		fields: [tryoutUserAnswer.selectedChoiceId],
		references: [tryoutQuestionChoice.id],
	}),
}));
