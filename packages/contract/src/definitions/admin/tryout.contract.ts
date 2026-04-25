import { tryout, tryoutAccessCode, tryoutAttempt, tryoutSubtest } from "@bimbelbeta/db/schema/tryout";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-arktype";
import { PageInfoSchema, PaginationInputSchema } from "@/common/pagination";
import { oc } from "@/lib/contract-definition";

const TryoutSchema = createSelectSchema(tryout)
	.pick("title", "description", "passingGrade", "category", "status", "startsAt", "endsAt", "createdAt", "updatedAt")
	.merge({
		id: "number",
		startsAt: "Date | null",
		endsAt: "Date | null",
		createdAt: "Date | null",
		updatedAt: "Date | null",
	});

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
	.merge({ id: "number", startedAt: "Date", deadline: "Date", completedAt: "Date | null", score: "number | null" });

const AccessCodeSchema = createSelectSchema(tryoutAccessCode)
	.pick("codePreview", "label", "isActive", "expiresAt", "maxUses", "usedCount", "createdAt", "updatedAt")
	.merge({
		id: "number",
		expiresAt: "Date | null",
		maxUses: "number | null",
		createdAt: "Date | null",
		updatedAt: "Date | null",
	});

export const adminTryoutAttemptContract = {
	list: oc
		.route({ path: "/admin/tryouts/{id}/attempts", method: "GET", tags: ["Admin - Tryouts"] })
		.input(type({ "...": PaginationInputSchema, id: "number" }))
		.output(
			type({
				items: type(
					{
						attempt: TryoutAttemptSchema,
						user: { id: "string", name: "string", email: "string", image: "string | null" },
						subtestAttempts: type(
							{
								subtestId: "number",
								score: "number | null",
							},
							"[]",
						),
					},
					"[]",
				),
				pageInfo: PageInfoSchema,
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
				"...": PaginationInputSchema,
				search: "string?",
				category: "'sd' | 'smp' | 'sma' | 'utbk'?",
				status: "'draft' | 'published' | 'archived'?",
			}),
		)
		.output(type({ items: TryoutSchema.array(), pageInfo: PageInfoSchema })),
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
	remove: oc
		.route({ path: "/admin/tryouts/{id}", method: "DELETE", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(type({ message: "string" })),
	attempts: adminTryoutAttemptContract,
	listAccessCodes: oc
		.route({ path: "/admin/tryouts/{id}/access-codes", method: "GET", tags: ["Admin - Tryouts"] })
		.input(type({ id: "number" }))
		.output(AccessCodeSchema.array()),
	createAccessCode: oc
		.route({ path: "/admin/tryouts/{id}/access-codes", method: "POST", tags: ["Admin - Tryouts"] })
		.input(
			type({
				id: "number",
				label: "string?",
				code: "string?",
				expiresAt: "string?",
				maxUses: "number?",
			}),
		)
		.output(type({ "...": AccessCodeSchema, code: "string" })),
	updateAccessCodeStatus: oc
		.route({ path: "/admin/tryouts/{id}/access-codes/{accessCodeId}", method: "PATCH", tags: ["Admin - Tryouts"] })
		.input(
			type({
				id: "number",
				accessCodeId: "number",
				isActive: "boolean",
			}),
		)
		.output(type({ id: "number", isActive: "boolean" })),
};
