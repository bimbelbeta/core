import { university } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { PageInfoSchema, PaginationInputSchema } from "../../../common/pagination";
import { oc } from "../../../lib/contract-definition";

const UniversitySchema = createSelectSchema(university)
	.pick("name", "slug", "logo", "description", "location", "website", "rank", "isActive")
	.merge({ id: "number" });

export const adminUniversitiesContract = {
	list: oc
		.route({ path: "/admin/universities", method: "GET", tags: ["Admin - Universities"] })
		.input(type({ "...": PaginationInputSchema, search: "string?" }))
		.output(type({ items: UniversitySchema.array(), pageInfo: PageInfoSchema })),
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
