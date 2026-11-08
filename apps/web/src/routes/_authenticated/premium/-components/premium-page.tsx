import { EmptyState } from "@/components/shared/empty-state";
import { usePremium } from "../-hooks/use-premium";
import { PlanTable } from "./plan-table";
import { PlanTableSkeleton } from "./plan-table-skeleton";
import { PremiumHeader } from "./premium-header";
import { ReferralRow } from "./referral-row";

export function PremiumPage() {
	const { productsQuery, subscriptionProducts, productProducts, isPremium, handlePurchase, isPending } = usePremium();

	const plans = [...(subscriptionProducts ?? []), ...(productProducts ?? [])];

	return (
		<div className="flex flex-col gap-8">
			<PremiumHeader />

			<section className="flex flex-col gap-2">
				{productsQuery.isLoading ? (
					<PlanTableSkeleton />
				) : productsQuery.isError ? (
					<EmptyState title="Gagal memuat paket" desc="Coba muat ulang halaman." />
				) : plans.length === 0 ? (
					<EmptyState title="Paket belum tersedia saat ini" />
				) : (
					<div className="bg-card overflow-hidden rounded-xl border">
						<PlanTable plans={plans} isPremium={isPremium} isPending={isPending} onPurchase={handlePurchase} />
						<ReferralRow />
					</div>
				)}
			</section>
		</div>
	);
}
