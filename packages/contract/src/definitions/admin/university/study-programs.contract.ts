import { type } from "arktype";
import { oc } from "../../../lib/contract-definition";

const StudyProgramSchema = type({
	id: "number",
	name: "string",
	slug: "string",
	description: "string | null",
	category: '"SAINTEK" | "SOSHUM" | null',
});

export const adminStudyProgramsContract = {
	list: oc
		.route({ path: "/admin/study-programs", method: "GET", tags: ["Admin - Study Programs"] })
		.input(type({ cursor: "number?", limit: "number?", search: "string?", category: '"SAINTEK" | "SOSHUM"?' }))
		.output(type({ data: StudyProgramSchema.array(), nextCursor: "number?" })),
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
