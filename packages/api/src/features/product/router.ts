import { authedNoPremiumImplementer } from "@/lib/router-definition";
import { productService } from "./service";

const authed = authedNoPremiumImplementer;

const list = authed.product.list.handler(async ({ input }) => productService.listForMember(input));

export const productRouter = {
	list,
};
