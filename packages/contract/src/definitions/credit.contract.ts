import { type } from "arktype";
import { oc } from "../lib/contract-definition";
import { createSelectSchema } from "drizzle-arktype";
import { product } from "@bimbelbeta/db/schema/transaction";

const CreditPackageSchema = createSelectSchema(product).pick('id', 'name', 'slug', 'price', 'credits')
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
    .output(CreditPackageSchema.array()),
};
