import { relations, sql } from "drizzle-orm";
import { date, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { question, questionAnswerOption } from "./practice-pack";

export const userFlashcardQuestionAnswer = pgTable(
	"user_flashcard_question_answer",
	{
		assignedDate: date("assigned_date", { mode: "date" }).notNull(),
		questionId: integer("question_id")
			.notNull()
			.references(() => question.id, { onDelete: "cascade" }),
		selectedAnswerId: integer("selected_answer_id").references(() => questionAnswerOption.id, { onDelete: "set null" }),
		attemptId: integer("attempt_id").references(() => userFlashcardAttempt.id, {
			onDelete: "set null",
		}),
		answeredAt: timestamp("answered_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.attemptId, t.assignedDate, t.questionId] })],
);

export const userFlashcardQuestionAnswerRelations = relations(userFlashcardQuestionAnswer, ({ one }) => ({
	question: one(question, {
		fields: [userFlashcardQuestionAnswer.questionId],
		references: [question.id],
	}),
	selectedAnswer: one(questionAnswerOption, {
		fields: [userFlashcardQuestionAnswer.selectedAnswerId],
		references: [questionAnswerOption.id],
	}),
	attempt: one(userFlashcardAttempt, {
		fields: [userFlashcardQuestionAnswer.attemptId],
		references: [userFlashcardAttempt.id],
	}),
}));

export const userFlashcardAttempt = pgTable("user_flashcard_attempt", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	date: date("date", { mode: "date" }).notNull().default(sql`CURRENT_DATE`),
	startedAt: timestamp("started_at").notNull().defaultNow(),
	deadline: timestamp().notNull(),
	submittedAt: timestamp("submitted_at"),
});

export const userFlashcardAttemptRelations = relations(userFlashcardAttempt, ({ one, many }) => ({
	user: one(user, {
		fields: [userFlashcardAttempt.userId],
		references: [user.id],
	}),
	assignedQuestions: many(userFlashcardQuestionAnswer),
}));
