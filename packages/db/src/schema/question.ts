import { relations } from "drizzle-orm";
import { boolean, char, integer, jsonb, pgEnum, pgTable, text, unique } from "drizzle-orm/pg-core";
import { tryoutSubtestQuestion } from "./tryout";

export const questionType = pgEnum("question_type", ["multiple_choice", "essay"]);

export const question = pgTable("question", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	type: questionType("type").notNull().default("multiple_choice"),
	content: text("content").notNull(),
	discussion: text("discussion").notNull(),
	contentJson: jsonb("content_json"),
	discussionJson: jsonb("discussion_json"),
});

export const questionRelations = relations(question, ({ many }) => ({
	choices: many(questionChoice),
	subtests: many(tryoutSubtestQuestion),
}));

export const questionChoice = pgTable(
	"question_choice",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		questionId: integer("question_id")
			.notNull()
			.references(() => question.id, { onDelete: "cascade" }),
		code: char({ length: 1 }).notNull(), // A, B, C...
		content: text().notNull(),
		isCorrect: boolean("is_correct").notNull().default(false),
	},
	(t) => [unique("question_choice_unique").on(t.questionId, t.code)],
);

export const questionChoiceRelations = relations(questionChoice, ({ one }) => ({
	question: one(question, {
		fields: [questionChoice.questionId],
		references: [question.id],
	}),
}));
