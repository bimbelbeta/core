import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const fileUpload = pgTable(
	"file_upload",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		originalName: text("original_name").notNull(),
		filename: text("filename").notNull(),
		fileSize: integer("file_size").notNull(),
		mimeType: text("mime_type").notNull(),
		s3Key: text("s3_key").notNull(),
		s3Url: text("s3_url").notNull(),
		bucket: text("bucket").notNull(),
		referenceType: text("reference_type"), // e.g., 'question', 'note', 'video'
		referenceId: integer("reference_id"), // ID of the content that references this file
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("file_upload_userId_idx").on(table.userId)],
);

export const fileUploadRelations = relations(fileUpload, ({ one }) => ({
	user: one(user, {
		fields: [fileUpload.userId],
		references: [user.id],
	}),
}));
