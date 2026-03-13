import { tryout, tryoutAttempt, tryoutSubtest } from "@bimbelbeta/db/schema/tryout";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { oc } from "../../lib/contract-definition";

const TryoutSchema = createSelectSchema(tryout)
	.pick("title", "description", "passingGrade", "category", "status", "startsAt", "endsAt", "createdAt", "updatedAt")
	.merge({ id: "number" });

const TryoutSubtestSchema = createSelectSchema(tryoutSubtest)
	.pick("tryoutId", "name", "description", "duration", "questionOrder", "order", "scoringMap")
	.merge({ id: "number" });

const TryoutAttemptSchema = createSelectSchema(tryoutAttempt)
	.pick(
		"userId",
		"tryoutId",
		"startedAt",
		"deadline",
		"completedAt",
		"status",
		"score",
		"submittedImageUrl",
		"isRevoked",
		"usedCredit",
	)
	.merge({ id: "number" });

export const adminTryoutAttemptContract = {
	list: oc
		.route({ path: "/admin/tryouts/{id}/attempts", method: "GET", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number", after: "number?", limit: "number = 10" }))
		.output(
			type({
				attempts: type(
					{
						attempt: TryoutAttemptSchema,
						user: { id: "string", name: "string", email: "string", image: "string | null" },
					},
					"[]",
				),
				nextCursor: "number | null | undefined",
			}),
		),
};

export const adminTryoutContract = {
	createTryout: oc
		.route({ path: "/admin/tryouts", method: "POST", tags: ["Admin - Tryouts"] })
		.input(
			type({
				title: "string",
				description: "string | null?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'",
				status: "'draft' | 'published' | 'archived'?",
				startsAt: "string?",
				endsAt: "string?",
			}),
		)
		.output(type({ message: "string", id: "number" })),
	list: oc
		.route({ path: "/admin/tryouts", method: "GET", tags: ["Admin - Tryouts"] })
		.input(
			type({
				cursor: "number?",
				limit: "number = 10",
				search: "string?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'?",
				status: "'draft' | 'published' | 'archived'?",
			}),
		)
		.output(type({ tryouts: TryoutSchema.array(), nextCursor: "number?" })),
	find: oc
		.route({ path: "/admin/tryouts/{id}", method: "GET", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(type({ tryout: TryoutSchema, subtests: TryoutSubtestSchema.array() })),
	updateTryout: oc
		.route({ path: "/admin/tryouts/{id}", method: "PATCH", tags: ["Admin - Tryouts"] })
		.input(
			type({
				id: "number",
				title: "string?",
				description: "string | null?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'?",
				status: "'draft' | 'published' | 'archived'?",
				startsAt: "string?",
				endsAt: "string?",
			}),
		)
		.output(type({ message: "string" })),
	deleteTryout: oc
		.route({ path: "/admin/tryouts/{id}", method: "DELETE", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(type({ message: "string" })),
	attempts: adminTryoutAttemptContract,
};
