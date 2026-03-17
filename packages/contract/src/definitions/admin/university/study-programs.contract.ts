import { studyProgram } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { PageInfoSchema, PaginationInputSchema } from "../../../common/pagination";
import { oc } from "../../../lib/contract-definition";

const StudyProgramSchema = createSelectSchema(studyProgram)
	.pick("name", "slug", "description", "category")
	.merge({ id: "number" });

export const adminStudyProgramsContract = {
	list: oc
		.route({ path: "/admin/study-programs", method: "GET", tags: ["Admin - Study Programs"] })
		.input(type({ "...": PaginationInputSchema, search: "string?", category: '"SAINTEK" | "SOSHUM"?' }))
		.output(type({ items: StudyProgramSchema.array(), pageInfo: PageInfoSchema })),
	find: oc
		.route({ path: "/admin/study-programs/{id}", method: "GET", tags: ["Admin - Study Programs"] })
		.input(type({ id: "number" }))
		.output(StudyProgramSchema),
	create: oc
		.route({ path: "/admin/study-programs", method: "POST", tags: ["Admin - Study Programs"] })
		.input(type({ name: "string", slug: "string", description: "string?", category: '"SAINTEK" | "SOSHUM"' }))
		.output(type({ message: "string", id: "number" })),
	update: oc
		.route({ path: "/admin/study-programs/{id}", method: "PATCH", tags: ["Admin - Study Programs"] })
		.input(
			type({
				id: "number",
				name: "string?",
				slug: "string?",
				description: "string?",
				category: '"SAINTEK" | "SOSHUM"?',
			}),
		)
		.output(type({ message: "string" })),
	remove: oc
		.route({ path: "/admin/study-programs/{id}", method: "DELETE", tags: ["Admin - Study Programs"] })
		.input(type({ id: "number" }))
		.output(type({ message: "string" })),
};
