import { product } from "@bimbelbeta/db/schema/transaction";
import { type } from "arktype";
import { createSelectSchema } from "drizzle-orm/arktype";
import { PageInfoSchema } from "@/common/pagination";
import { oc } from "@/lib/contract-definition";

const CreditPackageSchema = createSelectSchema(product).pick("id", "name", "slug", "price", "credits");
const BalanceSchema = type({
	balance: "number",
});

export const creditContract = {
	balance: oc
		.route({
			path: "/credits/balance",
			method: "GET",
			tags: ["Credits"],
		})
		.output(BalanceSchema),
	packages: oc
		.route({
			path: "/credits/packages",
			method: "GET",
			tags: ["Credits"],
		})
		.input(
			type({
				"limit?": "number >= 1",
				"after?": "string",
				"before?": "string",
			}),
		)
		.output(
			type({
				items: CreditPackageSchema.array(),
				pageInfo: PageInfoSchema,
			}),
		),
};
