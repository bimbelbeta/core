import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-orm/arktype";
import { oc } from "@/lib/contract-definition";

const GetTargetOutputSchema = type({
	university: createSelectSchema(university).pick("name", "slug", "logo").merge({ id: "number" }),
	studyProgram: createSelectSchema(studyProgram)
		.pick("name", "slug", "category")
		.merge({ id: "number" })
		.merge(createSelectSchema(universityStudyProgram).pick("averageScore", "accreditation")),
}).or({
	university: "null",
	studyProgram: "null",
});

const UpdateTargetInputSchema = type({
	universityId: "number",
	studyProgramId: "number",
});

const UpdateTargetOutputSchema = type({
	id: "string",
	targetUniversityId: "number | null",
	targetStudyProgramId: "number | null",
});

export const userSettingsContract = {
	findTarget: oc
		.route({
			path: "/user/target",
			method: "GET",
			tags: ["User"],
		})
		.output(GetTargetOutputSchema),

	update: oc
		.route({
			path: "/user/target",
			method: "PATCH",
			tags: ["User"],
		})
		.input(UpdateTargetInputSchema)
		.output(UpdateTargetOutputSchema),
};
