import { type } from "arktype";
import { oc } from "../../../lib/contract-definition";

const UniversityProgramSummarySchema = type({ id: "number", name: "string", slug: "string" });
const StudyProgramSummarySchema = type({ id: "number", name: "string", category: '"SAINTEK" | "SOSHUM" | null' });
const YearlyDataSchema = type({
	id: "number",
	year: "number",
	averageGrade: "number | null",
	passingGrade: "number | null",
	applicantCount: "number | null",
	passedCount: "number | null",
});
const UniversityProgramSchema = type({
	id: "number",
	university: UniversityProgramSummarySchema,
	studyProgram: StudyProgramSummarySchema,
	tuition: "number | null",
	capacity: "number | null",
	accreditation: "string | null",
	averageScore: "number | null",
	isActive: "boolean",
});

export const adminUniversityProgramsContract = {
	list: oc
		.route({ path: "/admin/university-programs", method: "GET", tags: ["Admin - University Programs"] })
		.input(type({ cursor: "number?", limit: "number?", universityId: "number?", studyProgramId: "number?" }))
		.output(type({ data: UniversityProgramSchema.array(), nextCursor: "number | null" })),
	find: oc
		.route({ path: "/admin/university-programs/{id}", method: "GET", tags: ["Admin - University Programs"] })
		.input(type({ id: "number" }))
		.output(type({ ...UniversityProgramSchema, yearlyData: YearlyDataSchema.array() })),
	create: oc
		.route({ path: "/admin/university-programs", method: "POST", tags: ["Admin - University Programs"] })
		.input(
			type({
				universityId: "number",
				studyProgramId: "number",
				tuition: "number?",
				capacity: "number?",
				accreditation: "string?",
				averageScore: "number?",
			}),
		)
		.output(type({ message: "string", id: "number" })),
	update: oc
		.route({ path: "/admin/university-programs/{id}", method: "PATCH", tags: ["Admin - University Programs"] })
		.input(
			type({
				id: "number",
				tuition: "number?",
				capacity: "number?",
				accreditation: "string?",
				averageScore: "number?",
				isActive: "boolean?",
			}),
		)
		.output(type({ message: "string" })),
	remove: oc
		.route({ path: "/admin/university-programs/{id}", method: "DELETE", tags: ["Admin - University Programs"] })
		.input(type({ id: "number" }))
		.output(type({ message: "string" })),
	upsertYearlyData: oc
		.route({ path: "/admin/university-programs/{id}/yearly", method: "POST", tags: ["Admin - University Programs"] })
		.input(
			type({
				id: "number",
				year: "number",
				averageGrade: "number?",
				passingGrade: "number?",
				applicantCount: "number?",
				passedCount: "number?",
			}),
		)
		.output(type({ message: "string", id: "number" })),
	deleteYearlyData: oc
		.route({
			path: "/admin/university-programs/{id}/yearly/{year}",
			method: "DELETE",
			tags: ["Admin - University Programs"],
		})
		.input(type({ id: "number", year: "number" }))
		.output(type({ message: "string" })),
};
