import { Coins } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Highlight } from "@/components/ui/highlight";
import { Typography } from "@/components/ui/typography";
import { usePremium } from "../-hooks/use-premium";
import { PackageCard } from "./package-card";
import { PremiumHeader } from "./premium-header";
import { PremiumSkeleton } from "./premium-skeleton";
import { ReferralSection } from "./referral-section";

export function PremiumPage() {
	const { productsQuery, subscriptionProducts, productProducts, isPremium, creditBalance, handlePurchase, isPending } =
		usePremium();

	if (productsQuery.isLoading) {
		return <PremiumSkeleton />;
	}

	if (productsQuery.isError) {
		return (
			<Container className="max-w-7xl items-center gap-8 py-8">
				<Card className="border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-800">
					<Typography>Gagal memuat paket. Coba refresh halaman.</Typography>
				</Card>
			</Container>
		);
	}

	return (
		<Container className="max-w-7xl items-center gap-8 py-8">
			<PremiumHeader />

			<div className="space-y-6">
				<div className="text-center *:text-pretty">
					<Typography variant="title" as="h2">
						Pilih Paket <Highlight variant="secondary">Premium</Highlight>
					</Typography>
					<Typography className="mt-2 text-neutral-800">
						Pilih paket yang sesuai dengan kebutuhanmu. Premium untuk akses penuh, atau beli kredit tryout satuan.
					</Typography>
				</div>

				{subscriptionProducts && subscriptionProducts.length > 0 && (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{subscriptionProducts.map((product) => (
							<PackageCard
								key={product.slug}
								name={product.name}
								slug={product.slug}
								price={product.price}
								credits={product.credits}
								variant={product.variant}
								fixedExpiryMonth={product.fixedExpiryMonth}
								fixedExpiryDay={product.fixedExpiryDay}
								durationDays={product.durationDays}
								isPurchased={isPremium}
								isPending={isPending}
								onPurchase={handlePurchase}
								disabled={isPremium}
							/>
						))}
					</div>
				)}

				{productProducts && productProducts.length > 0 && (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
						{productProducts.map((product) => (
							<PackageCard
								key={product.slug}
								name={product.name}
								slug={product.slug}
								price={product.price}
								credits={product.credits}
								variant={product.variant}
								fixedExpiryMonth={product.fixedExpiryMonth}
								fixedExpiryDay={product.fixedExpiryDay}
								durationDays={product.durationDays}
								isPending={isPending}
								onPurchase={handlePurchase}
							/>
						))}
					</div>
				)}

				{!subscriptionProducts?.length && !productProducts?.length && !productsQuery.isLoading && (
					<Card className="border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-800">
						<Typography>Paket belum tersedia saat ini.</Typography>
					</Card>
				)}
			</div>

			{creditBalance > 0 && (
				<Card className="border-amber-200 bg-amber-50 p-6">
					<div className="flex items-center gap-4">
						<div className="rounded-full bg-amber-100 p-3">
							<Coins size={28} weight="fill" className="text-amber-600" />
						</div>
						<div>
							<Typography variant="subtitle4" className="text-amber-900">
								Kredit Tryout Kamu
							</Typography>
							<Typography className="text-amber-700">
								Kamu memiliki <strong>{creditBalance}</strong> kredit tryout. Gunakan untuk memulai tryout pilihanmu di
								halaman Tryout.
							</Typography>
						</div>
					</div>
				</Card>
			)}

			<ReferralSection />
		</Container>
	);
}
