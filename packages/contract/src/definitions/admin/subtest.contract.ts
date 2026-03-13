import { type } from "arktype";
import { oc } from "../../lib/contract-definition";

const SubtestSchema = type({
	id: "number",
	tryoutId: "number",
	name: "string",
	description: "string | null",
	duration: "number",
	questionOrder: "string",
	order: "number",
	scoringMap: "Record<string, number> | null",
});

export const adminSubtestContract = {
	find: oc
		.route({ path: "/admin/tryouts/subtests/{id}", method: "GET", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(SubtestSchema),
	createSubtest: oc
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
	updateSubtest: oc
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
	deleteSubtest: oc
		.route({ path: "/admin/tryouts/subtests/{id}", method: "DELETE", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(type({ message: "string" })),
};
