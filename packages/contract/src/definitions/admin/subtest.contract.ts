import { tryoutSubtest } from "@bimbelbeta/db/schema/tryout";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "@/lib/contract-definition";

const SubtestSchema = createSelectSchema(tryoutSubtest)
	.pick("tryoutId", "name", "description", "duration", "questionOrder", "order", "scoringMap")
	.merge({ id: "number" });

export const adminSubtestContract = {
	find: oc
		.route({ path: "/admin/tryouts/subtests/{id}", method: "GET", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(SubtestSchema),
	create: oc
		.route({ path: "/admin/tryouts/{tryoutId}/subtests", method: "POST", tags: ["Admin - Tryouts"] })
		.input(
			type({
				tryoutId: "number",
				name: "string",
				description: "string?",
				duration: "number?",
				questionOrder: "'random' | 'sequential'?",
			}),
		)
		.output(type({ message: "string", id: "number" })),
	update: oc
		.route({ path: "/admin/tryouts/subtests/{id}", method: "PATCH", tags: ["Admin - Tryouts"] })
		.input(
			type({
				id: "number",
				name: "string?",
				description: "string?",
				duration: "number?",
				questionOrder: "'random' | 'sequential'?",
				scoringMap: type("Record<string, number>").or("null").optional(),
			}),
		)
		.output(type({ message: "string" })),
	remove: oc
		.route({ path: "/admin/tryouts/subtests/{id}", method: "DELETE", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(type({ message: "string" })),
};
