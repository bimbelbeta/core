import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
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

const SetTargetOutputSchema = type({
	success: "boolean",
	message: "string",
});

export const userSettingsContract = {
	getTarget: oc
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
		.output(SetTargetOutputSchema),
};
