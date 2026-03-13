import { type } from "arktype";
import { oc } from "../../lib/contract-definition";

const TryoutSchema = type({
	id: "number",
	title: "string",
	description: "string | null",
	passingGrade: "number",
	category: "'sd' | 'smp' | 'sma' | 'utbk'",
	status: "'draft' | 'published' | 'archived'",
	startsAt: "Date | null",
	endsAt: "Date | null",
	createdAt: "Date | null",
	updatedAt: "Date | null",
});

const TryoutSubtestSchema = type({
	id: "number",
	tryoutId: "number",
	name: "string",
	description: "string | null",
	duration: "number",
	questionOrder: "string",
	order: "number",
	scoringMap: "Record<string, number> | null",
});

const TryoutAttemptSchema = type({
	id: "number",
	userId: "string",
	tryoutId: "number",
	startedAt: "Date",
	deadline: "Date",
	completedAt: "Date | null",
	status: "'not_started' | 'ongoing' | 'finished'",
	score: "number | null",
	submittedImageUrl: "string | null",
	isRevoked: "boolean",
	usedCredit: "boolean",
});

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
