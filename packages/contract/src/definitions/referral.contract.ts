import { type } from "arktype";
import { oc } from "@/lib/contract-definition";

const RedeemInputSchema = type({
	code: type(/^[A-Za-z0-9]+$/).pipe((s) => s.toUpperCase()),
});

const RedeemOutputSchema = type({
	message: "string",
	premiumExpiresAt: "Date",
});

export const referralContract = {
	redeem: oc
		.route({
			path: "/referral/redeem",
			method: "POST",
			tags: ["Referral"],
		})
		.input(RedeemInputSchema)
		.output(RedeemOutputSchema),
};
