import { defineRelationsPart } from "drizzle-orm";
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
		averageScore: integer("average_score").notNull().default(500),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(t) => [unique("university_study_program_unique").on(t.universityId, t.studyProgramId)],
);

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

export const universityRelations = defineRelationsPart(
	{
		university,
		studyProgram,
		universityStudyProgram,
		programYearlyData,
	},
	(r) => ({
		university: {
			studyPrograms: r.many.universityStudyProgram({
				from: r.university.id,
				to: r.universityStudyProgram.universityId,
			}),
		},
		studyProgram: {
			universities: r.many.universityStudyProgram({
				from: r.studyProgram.id,
				to: r.universityStudyProgram.studyProgramId,
			}),
		},
		universityStudyProgram: {
			university: r.one.university({
				from: r.universityStudyProgram.universityId,
				to: r.university.id,
			}),
			studyProgram: r.one.studyProgram({
				from: r.universityStudyProgram.studyProgramId,
				to: r.studyProgram.id,
			}),
			yearlyData: r.many.programYearlyData({
				from: r.universityStudyProgram.id,
				to: r.programYearlyData.universityStudyProgramId,
			}),
		},
		programYearlyData: {
			universityStudyProgram: r.one.universityStudyProgram({
				from: r.programYearlyData.universityStudyProgramId,
				to: r.universityStudyProgram.id,
			}),
		},
	}),
);
