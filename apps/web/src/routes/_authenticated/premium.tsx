import { Coins } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Highlight } from "@/components/ui/highlight";
import { createMeta } from "@/lib/seo-utils";
import { orpc } from "@/utils/orpc";
import { PackageCard } from "./premium/-components/package-card";
import { PremiumSkeleton } from "./premium/-components/premium-skeleton";
import { useMidtrans } from "./premium/-hooks/use-midtrans";

export const Route = createFileRoute("/_authenticated/premium")({
	head: () => ({
		meta: createMeta({
			title: "Premium & Paket Tryout",
			description: "Upgrade ke premium atau beli paket tryout untuk akses penuh ke semua fitur bimbelbeta.",
			noIndex: true,
		}),
	}),
	component: RouteComponent,
});

function PremiumHeader({ creditBalance }: { creditBalance: number }) {
	return (
		<div className="relative overflow-hidden rounded-default bg-primary-300 text-white">
			<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-2 sm:items-center sm:px-10 sm:py-10">
				<div className="relative z-10 max-w-xl">
					<h1 className="font-bold text-[24px] leading-tight sm:text-[30px]">Premium & Paket Tryout</h1>
					<p className="mt-2 text-[14px] text-white/90 leading-5.25">
						Investasikan masa depanmu sekarang! Dapatkan akses penuh ke semua fitur atau beli paket tryout sesuai
						kebutuhanmu.
					</p>
					{creditBalance > 0 && (
						<div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
							<Coins size={20} weight="fill" className="text-yellow-300" />
							<span className="font-medium text-sm">
								Kredit Tryout: <strong>{creditBalance}</strong>
							</span>
						</div>
					)}
				</div>

				<div className="relative -mx-6 h-27.5 overflow-hidden sm:mx-0 sm:h-auto sm:overflow-visible">
					<div className="absolute top-10 right-4 bottom-0 size-45 rounded-full bg-primary-400 sm:top-2" />
					<Image
						src="/images/main-card-kelas.webp"
						alt="Premium Avatar"
						width={260}
						height={260}
						className="absolute right-0 size-52.5 -translate-y-10 select-none object-cover sm:bottom-0 sm:translate-y-1/2"
					/>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const { handlePurchase, isPending } = useMidtrans();

	// Fetch credit balance
	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());

	// Fetch all products from API
	const productsQuery = useQuery(orpc.product.list.queryOptions());

	const isPremium = session?.user.isPremium;
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	// Sort products: premium variants first, then credits
	const sortedProducts = productsQuery.data?.sort((a, b) => {
		const aIsPremium = a.variant === "fixed_date" || a.variant === "monthly";
		const bIsPremium = b.variant === "fixed_date" || b.variant === "monthly";
		if (aIsPremium && !bIsPremium) return -1;
		if (!aIsPremium && bIsPremium) return 1;
		return 0;
	});

	// Split products into premium and credits
	const premiumProducts = sortedProducts?.filter((p) => p.variant === "fixed_date" || p.variant === "monthly");
	const creditProducts = sortedProducts?.filter((p) => p.variant === "credits");

	// Show skeleton while loading products
	if (productsQuery.isLoading) {
		return <PremiumSkeleton />;
	}

	return (
		<Container className="max-w-7xl items-center gap-8 py-8">
			<PremiumHeader creditBalance={creditBalance} />

			<div className="space-y-6">
				<div className="text-center *:text-pretty">
					<h2 className="font-bold text-2xl leading-9 md:text-3xl md:leading-11.5">
						Pilih Paket <Highlight variant="secondary">Premium</Highlight>
					</h2>
					<p className="mt-2 text-neutral-600 text-sm md:text-base">
						Pilih paket yang sesuai dengan kebutuhanmu. Premium untuk akses penuh, atau beli kredit tryout satuan.
					</p>
				</div>

				{/* Premium Packages - 2 columns */}
				{premiumProducts && premiumProducts.length > 0 && (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{premiumProducts.map((product) => (
							<PackageCard
								key={product.slug}
								name={product.name}
								slug={product.slug}
								price={product.price}
								credits={product.credits}
								variant={product.variant}
								isPurchased={isPremium}
								isPending={isPending}
								onPurchase={handlePurchase}
								disabled={isPremium}
							/>
						))}
					</div>
				)}

				{/* Credit Packages - 4 columns */}
				{creditProducts && creditProducts.length > 0 && (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
						{creditProducts.map((product) => (
							<PackageCard
								key={product.slug}
								name={product.name}
								slug={product.slug}
								price={product.price}
								credits={product.credits}
								variant={product.variant}
								isPending={isPending}
								onPurchase={handlePurchase}
							/>
						))}
					</div>
				)}
			</div>

			{/* Credit balance info for users with credits */}
			{creditBalance > 0 && (
				<Card className="border-amber-200 bg-amber-50 p-6">
					<div className="flex items-center gap-4">
						<div className="rounded-full bg-amber-100 p-3">
							<Coins size={28} weight="fill" className="text-amber-600" />
						</div>
						<div>
							<h3 className="font-semibold text-amber-900">Kredit Tryout Kamu</h3>
							<p className="text-amber-700 text-sm">
								Kamu memiliki <strong>{creditBalance}</strong> kredit tryout. Gunakan untuk memulai tryout pilihanmu di
								halaman Tryout.
							</p>
						</div>
					</div>
				</Card>
			)}
		</Container>
	);
}
