import { user } from "@bimbelbeta/db/schema/auth";
import { referralCode } from "@bimbelbeta/db/schema/referral";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-orm/arktype";
import { PageInfoSchema, PaginationInputSchema } from "@/common/pagination";
import { MessageResponseSchema } from "@/common/response";
import { oc } from "@/lib/contract-definition";

const ReferralCodeSchema = createSelectSchema(referralCode);
const _UserSchema = createSelectSchema(user);

const AlphanumericCodeSchema = type(/^[A-Z0-9]+$/).pipe((s) => s.toUpperCase());

const ReferralListInputSchema = type({
	"...": PaginationInputSchema,
	"search?": "string",
	"status?": "boolean",
});

const ReferralListOutputSchema = type({
	items: ReferralCodeSchema.array(),
	pageInfo: PageInfoSchema,
});

const CreateReferralInputSchema = type({
	code: AlphanumericCodeSchema.optional(),
	premiumDays: "number > 0",
	"maxUsages?": "number > 0 | null",
	"validUntil?": "Date | null",
});

const UpdateReferralStatusInputSchema = type({
	codeId: "string",
	status: "boolean",
});

const BulkDeactivateInputSchema = type({
	codeIds: "string[]",
});

const ReferralUsageUserSchema = type({
	usageId: "string",
	claimedAt: "Date",
	userId: "string",
	userName: "string",
	userEmail: "string",
	isPremium: "boolean | null",
	premiumExpiresAt: "Date | null",
});

const ReferralUsagesOutputSchema = type({
	referralCode: ReferralCodeSchema,
	items: ReferralUsageUserSchema.array(),
	pageInfo: PageInfoSchema,
});

export const adminReferralContract = {
	list: oc
		.route({
			path: "/admin/referrals",
			method: "GET",
			tags: ["Admin - Referral"],
		})
		.input(ReferralListInputSchema)
		.output(ReferralListOutputSchema),
	create: oc
		.route({
			path: "/admin/referrals",
			method: "POST",
			tags: ["Admin - Referral"],
		})
		.input(CreateReferralInputSchema)
		.output(ReferralCodeSchema),
	updateStatus: oc
		.route({
			path: "/admin/referrals/{codeId}/status",
			method: "PATCH",
			tags: ["Admin - Referral"],
		})
		.input(UpdateReferralStatusInputSchema)
		.output(MessageResponseSchema),
	bulkDeactivate: oc
		.route({
			path: "/admin/referrals/bulk-deactivate",
			method: "POST",
			tags: ["Admin - Referral"],
		})
		.input(BulkDeactivateInputSchema)
		.output(MessageResponseSchema),
	getUsages: oc
		.route({
			path: "/admin/referrals/{codeId}/usages",
			method: "GET",
			tags: ["Admin - Referral"],
		})
		.input(
			type({
				"...": PaginationInputSchema,
				codeId: "string",
			}),
		)
		.output(ReferralUsagesOutputSchema),
};
