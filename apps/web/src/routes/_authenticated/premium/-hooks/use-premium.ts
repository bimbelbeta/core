import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";
import { useMidtrans } from "./use-midtrans";

export function usePremium() {
	const { session } = useRouteContext({ from: "/_authenticated" });
	const { handlePurchase, isPending } = useMidtrans();
	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());
	const productsQuery = useQuery(orpc.product.list.queryOptions({ input: { limit: 100 } }));
	const isPremium = session?.user.isPremium;
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	const sortedProducts = productsQuery.data
		? [...productsQuery.data.items].sort((a, b) => {
				const aIsSubscription = a.variant === "fixed_date" || a.variant === "monthly";
				const bIsSubscription = b.variant === "fixed_date" || b.variant === "monthly";
				if (aIsSubscription && !bIsSubscription) return -1;
				if (!aIsSubscription && bIsSubscription) return 1;
				return 0;
			})
		: undefined;

	const subscriptionProducts = sortedProducts?.filter((p) => p.variant === "fixed_date" || p.variant === "monthly");
	const productProducts = sortedProducts?.filter((p) => p.variant === "credits");

	return { productsQuery, subscriptionProducts, productProducts, isPremium, creditBalance, handlePurchase, isPending };
}
