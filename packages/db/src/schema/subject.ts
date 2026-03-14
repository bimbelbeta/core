import { defineRelationsPart } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { question } from "./question";

/*
  Subject (Classes)
*/
export const subjectCategoryEnum = pgEnum("subject_category", ["sd", "smp", "sma", "utbk"]);

export const subject = pgTable("subject", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: text().notNull(),
	shortName: text("short_name").notNull().unique(),
	description: text(),
	order: integer().notNull().default(1),
	category: subjectCategoryEnum("category").notNull().default("utbk"),
	gradeLevel: integer("grade_level"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/*
  Content Item
*/
export const contentItem = pgTable(
	"content_item",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		subjectId: integer("subject_id")
			.notNull()
			.references(() => subject.id, { onDelete: "cascade" }),
		title: text().notNull(),
		order: integer().notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [unique("unique_content_order").on(t.subjectId, t.order)],
);

/*
  Content Components (Optional, max 1 per content)
*/
export const videoMaterial = pgTable("video_material", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	contentItemId: integer("content_item_id")
		.notNull()
		.unique()
		.references(() => contentItem.id, { onDelete: "cascade" }),
	videoUrl: text("video_url").notNull(), // YouTube URL
	content: jsonb().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const noteMaterial = pgTable("note_material", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	contentItemId: integer("content_item_id")
		.notNull()
		.unique() // one-to-one
		.references(() => contentItem.id, { onDelete: "cascade" }),
	content: jsonb().notNull(), // Lexical/rich text JSON
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contentPracticeQuestions = pgTable(
	"content_practice_questions",
	{
		contentItemId: integer("content_item_id")
			.notNull()
			.references(() => contentItem.id, { onDelete: "cascade" }),
		questionId: integer("question_id")
			.notNull()
			.references(() => question.id, { onDelete: "cascade" }),
		order: integer().notNull().default(1),
	},
	(t) => [
		// Composite primary key
		{ pk: { columns: [t.contentItemId, t.questionId] } },
		// Ensure unique order per content
		unique("unique_practice_questions_order").on(t.contentItemId, t.order),
	],
);

/*
  User Progress
*/
export const userProgress = pgTable(
	"user_progress",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		contentItemId: integer("content_item_id")
			.notNull()
			.references(() => contentItem.id, { onDelete: "cascade" }),
		videoCompleted: boolean("video_completed").notNull().default(false),
		noteCompleted: boolean("note_completed").notNull().default(false),
		practiceQuestionsCompleted: boolean("practice_questions_completed").notNull().default(false),
		lastViewedAt: timestamp("last_viewed_at").notNull().defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [
		// One progress record per user per content
		unique("unique_user_content").on(t.userId, t.contentItemId),
		// Index for queries
		index("idx_user_progress_user").on(t.userId),
		index("idx_user_progress_content").on(t.contentItemId),
	],
);

/*
  Recent Content Views (Keep last 5 per user)
*/
export const recentContentView = pgTable(
	"recent_content_view",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		contentItemId: integer("content_item_id")
			.notNull()
			.references(() => contentItem.id, { onDelete: "cascade" }),
		viewedAt: timestamp("viewed_at").notNull().defaultNow(),
	},
	(t) => [index("idx_recent_view_user_time").on(t.userId, t.viewedAt)],
);

/*
  User Subject View (Track which subjects a user has opened)
*/
export const userSubjectView = pgTable(
	"user_subject_view",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		subjectId: integer("subject_id")
			.notNull()
			.references(() => subject.id, { onDelete: "cascade" }),
		viewedAt: timestamp("viewed_at").notNull().defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => [unique("unique_user_subject").on(t.userId, t.subjectId), index("idx_user_subject_view_user").on(t.userId)],
);

/*
  Relations
*/
export const subjectRelations = defineRelationsPart(
	{
		subject,
		contentItem,
		videoMaterial,
		noteMaterial,
		contentPracticeQuestions,
		userProgress,
		recentContentView,
		userSubjectView,
		user,
		question,
	},
	(r) => ({
		subject: {
			contentItems: r.many.contentItem({
				from: r.subject.id,
				to: r.contentItem.subjectId,
			}),
			userSubjectViews: r.many.userSubjectView({
				from: r.subject.id,
				to: r.userSubjectView.subjectId,
			}),
		},
		contentItem: {
			subject: r.one.subject({
				from: r.contentItem.subjectId,
				to: r.subject.id,
			}),
			videoMaterial: r.one.videoMaterial({
				from: r.contentItem.id,
				to: r.videoMaterial.contentItemId,
			}),
			noteMaterial: r.one.noteMaterial({
				from: r.contentItem.id,
				to: r.noteMaterial.contentItemId,
			}),
			practiceQuestions: r.many.contentPracticeQuestions({
				from: r.contentItem.id,
				to: r.contentPracticeQuestions.contentItemId,
			}),
			userProgress: r.many.userProgress({
				from: r.contentItem.id,
				to: r.userProgress.contentItemId,
			}),
			recentViews: r.many.recentContentView({
				from: r.contentItem.id,
				to: r.recentContentView.contentItemId,
			}),
		},
		videoMaterial: {
			contentItem: r.one.contentItem({
				from: r.videoMaterial.contentItemId,
				to: r.contentItem.id,
			}),
		},
		noteMaterial: {
			contentItem: r.one.contentItem({
				from: r.noteMaterial.contentItemId,
				to: r.contentItem.id,
			}),
		},
		contentPracticeQuestions: {
			contentItem: r.one.contentItem({
				from: r.contentPracticeQuestions.contentItemId,
				to: r.contentItem.id,
			}),
			question: r.one.question({
				from: r.contentPracticeQuestions.questionId,
				to: r.question.id,
			}),
		},
		userProgress: {
			user: r.one.user({
				from: r.userProgress.userId,
				to: r.user.id,
			}),
			contentItem: r.one.contentItem({
				from: r.userProgress.contentItemId,
				to: r.contentItem.id,
			}),
		},
		recentContentView: {
			user: r.one.user({
				from: r.recentContentView.userId,
				to: r.user.id,
			}),
			contentItem: r.one.contentItem({
				from: r.recentContentView.contentItemId,
				to: r.contentItem.id,
			}),
		},
		userSubjectView: {
			user: r.one.user({
				from: r.userSubjectView.userId,
				to: r.user.id,
			}),
			subject: r.one.subject({
				from: r.userSubjectView.subjectId,
				to: r.subject.id,
			}),
		},
	}),
);
