import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../lib/contract-definition";

const UniversitySchema = createSelectSchema(university).pick("name", "slug", "logo").merge({ id: "number" });

const StudyProgramSchema = createSelectSchema(studyProgram).pick("name", "category").merge({ id: "number" });

const StudyProgramDataSchema = type({
	"...": createSelectSchema(universityStudyProgram)
		.pick("universityId", "studyProgramId", "tuition", "capacity", "accreditation", "averageScore")
		.merge({ id: "number" }),
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
