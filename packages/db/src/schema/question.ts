import { defineRelationsPart } from "drizzle-orm";
import { boolean, char, integer, jsonb, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const questionType = pgEnum("question_type", ["multiple_choice", "multiple_choice_complex", "essay"]);

export const question = pgTable("question", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	type: questionType("type").notNull().default("multiple_choice"),
	// Plain-text content kept for backward compat during Tiptap migration.
	// Migration complete when contentJson/discussionJson are non-null for all rows;
	// at that point content/discussion columns can be dropped.
	content: text("content").notNull(),
	discussion: text("discussion").notNull(),
	contentJson: jsonb("content_json"),
	discussionJson: jsonb("discussion_json"),
	essayCorrectAnswer: text("essay_correct_answer"),
	tags: text("tags").array(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

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
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [unique("question_choice_unique").on(t.questionId, t.code)],
);

export const questionRelations = defineRelationsPart({ question, questionChoice }, (r) => ({
	question: {
		choices: r.many.questionChoice({
			from: r.question.id,
			to: r.questionChoice.questionId,
		}),
	},
	questionChoice: {
		question: r.one.question({
			from: r.questionChoice.questionId,
			to: r.question.id,
		}),
	},
}));
