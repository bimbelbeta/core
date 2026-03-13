import { type } from "arktype";
import { oc } from "../../../lib/contract-definition";

const UniversitySchema = type({
	id: "number",
	name: "string",
	slug: "string",
	logo: "string | null",
	description: "string | null",
	location: "string | null",
	website: "string | null",
	rank: "number | null",
	isActive: "boolean",
});

export const adminUniversitiesContract = {
	list: oc
		.route({ path: "/admin/universities", method: "GET", tags: ["Admin - Universities"] })
		.input(type({ cursor: "number?", limit: "number?", search: "string?" }))
		.output(type({ data: UniversitySchema.array(), nextCursor: "number | null" })),
	find: oc
		.route({ path: "/admin/universities/{id}", method: "GET", tags: ["Admin - Universities"] })
		.input(type({ id: "number" }))
		.output(UniversitySchema),
	create: oc
		.route({ path: "/admin/universities", method: "POST", tags: ["Admin - Universities"] })
		.input(
			type({
				name: "string",
				slug: "string",
				logo: "string?",
				description: "string?",
				location: "string?",
				website: "string?",
				rank: "number?",
			}),
		)
		.output(type({ message: "string", id: "number" })),
	update: oc
		.route({ path: "/admin/universities/{id}", method: "PATCH", tags: ["Admin - Universities"] })
		.input(
			type({
				id: "number",
				name: "string?",
				slug: "string?",
				logo: "string?",
				description: "string?",
				location: "string?",
				website: "string?",
				rank: "number?",
				isActive: "boolean?",
			}),
		)
		.output(type({ message: "string" })),
	remove: oc
		.route({ path: "/admin/universities/{id}", method: "DELETE", tags: ["Admin - Universities"] })
		.input(type({ id: "number" }))
		.output(type({ message: "string" })),
};
