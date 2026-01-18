import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const studyProgramCategory = pgEnum("study_program_category", ["SAINTEK", "SOSHUM"]);

export const university = pgTable(
	"university",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		slug: text().notNull().unique(),
		logo: text(),
		description: text(),
		location: text(),
		website: text(),
		rank: integer(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [unique("university_slug").on(t.slug)],
);

export const universityRelations = relations(university, ({ many }) => ({
	studyPrograms: many(universityStudyProgram),
}));

export const studyProgram = pgTable(
	"study_program",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		slug: text().notNull().unique(),
		description: text(),
		category: studyProgramCategory("category"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [unique("study_program_slug").on(t.slug)],
);

export const studyProgramRelations = relations(studyProgram, ({ many }) => ({
	universities: many(universityStudyProgram),
}));

export const universityStudyProgram = pgTable(
	"university_study_program",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		universityId: integer("university_id")
			.notNull()
			.references(() => university.id, { onDelete: "cascade" }),
		studyProgramId: integer("study_program_id")
			.notNull()
			.references(() => studyProgram.id, { onDelete: "cascade" }),
		tuition: integer(),
		capacity: integer(),
		accreditation: text(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [unique("university_study_program_unique").on(t.universityId, t.studyProgramId)],
);

export const universityStudyProgramRelations = relations(universityStudyProgram, ({ one, many }) => ({
	university: one(university, {
		fields: [universityStudyProgram.universityId],
		references: [university.id],
	}),
	studyProgram: one(studyProgram, {
		fields: [universityStudyProgram.studyProgramId],
		references: [studyProgram.id],
	}),
	yearlyData: many(programYearlyData),
}));

export const programYearlyData = pgTable(
	"program_yearly_data",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		universityStudyProgramId: integer("university_study_program_id")
			.notNull()
			.references(() => universityStudyProgram.id, { onDelete: "cascade" }),
		year: integer().notNull(),
		averageGrade: integer("average_grade"),
		passingGrade: integer("passing_grade"),
		applicantCount: integer("applicant_count"),
		passedCount: integer("passed_count"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [unique("program_yearly_data_unique").on(t.universityStudyProgramId, t.year)],
);

export const programYearlyDataRelations = relations(programYearlyData, ({ one }) => ({
	universityStudyProgram: one(universityStudyProgram, {
		fields: [programYearlyData.universityStudyProgramId],
		references: [universityStudyProgram.id],
	}),
}));
