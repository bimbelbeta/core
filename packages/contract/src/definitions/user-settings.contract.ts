import { type } from "arktype";
import { oc } from "../lib/contract-definition";

const UniversitySchema = type({
	id: "number",
	name: "string",
	slug: "string",
	logo: "string | null",
});

const StudyProgramSchema = type({
	id: "number",
	name: "string",
	category: "string | null",
});

const StudyProgramDataSchema = type({
	id: "number",
	universityId: "number",
	studyProgramId: "number",
	tuition: "number | null",
	capacity: "number | null",
	accreditation: "string | null",
	averageScore: "number | null",
	studyProgram: StudyProgramSchema,
	university: UniversitySchema,
});

const GetTargetOutputSchema = type({
	studyProgramData: StudyProgramDataSchema.or("null"),
});

const SetTargetInputSchema = type({
	universityId: "number",
	studyProgramId: "number",
});

const SetTargetOutputSchema = type({
	success: "boolean",
	message: "string",
});

export const userSettingsContract = {
	find: oc
		.route({
			path: "/user/target",
			method: "GET",
			tags: ["User"],
		})
		.output(GetTargetOutputSchema),

	set: oc
		.route({
			path: "/user/target",
			method: "PATCH",
			tags: ["User"],
		})
		.input(SetTargetInputSchema)
		.output(SetTargetOutputSchema),
};
