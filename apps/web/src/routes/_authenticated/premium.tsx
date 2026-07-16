import { Coins, SpinnerGapIcon, TicketIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Highlight } from "@/components/ui/highlight";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { createMeta } from "@/lib/seo-utils";
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

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const { handlePurchase, isPending } = useMidtrans();
	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());
	const productsQuery = useQuery(orpc.product.list.queryOptions({ input: { limit: 100 } }));
	const isPremium = session?.user.isPremium;
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	// Grouping is based on variant so it works even if API doesn't return `type` yet.
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

	if (productsQuery.isLoading) {
		return <PremiumSkeleton />;
	}

	if (productsQuery.isError) {
		return (
			<Container className="max-w-7xl items-center gap-8 py-8">
				<Card className="border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-700">
					<p className="text-sm">Gagal memuat paket. Coba refresh halaman.</p>
				</Card>
			</Container>
		);
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

				{/* Subscription Packages - 2 columns */}
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

				{/* Product/Credit Packages - 4 columns */}
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
					<Card className="border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-700">
						<p className="text-sm">Paket belum tersedia saat ini.</p>
					</Card>
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

			<ReferralSection />
		</Container>
	);
}

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

function ReferralSection() {
	const [code, setCode] = useState("");
	const [successData, setSuccessData] = useState<{ message: string; premiumExpiresAt: Date } | null>(null);

	const redeemMutation = useMutation(
		orpc.referral.redeem.mutationOptions({
			onSuccess: (res) => {
				setSuccessData(res);
				setCode("");
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = code.trim();
		if (!trimmed) return;
		if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
			toast.error("Kode tidak valid — hanya huruf dan angka yang diperbolehkan.");
			return;
		}
		redeemMutation.mutate({ code: trimmed });
	};

	return (
		<>
			<Card className="border-primary-100 bg-gradient-to-br from-primary-50 to-white p-6">
				<div className="flex items-start gap-4">
					<div className="hidden rounded-xl bg-primary-100 p-3 sm:block">
						<TicketIcon size={28} weight="duotone" className="text-primary" />
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-base text-foreground">Punya kode referal?</h3>
						<p className="mt-0.5 text-muted-foreground text-sm">
							Masukkan kode referal untuk mendapatkan akses Premium secara gratis.
						</p>
						<form onSubmit={handleSubmit} className="mt-4 flex gap-2">
							<Input
								id="referral-code-input"
								className="max-w-xs font-mono uppercase tracking-widest"
								placeholder="PREM30DAYS"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
								maxLength={20}
								autoComplete="off"
								disabled={redeemMutation.isPending}
							/>
							<Button id="referral-submit-btn" type="submit" disabled={redeemMutation.isPending || !code.trim()}>
								{redeemMutation.isPending ? (
									<>
										<SpinnerGapIcon className="mr-2 size-4 animate-spin" />
										Mengecek...
									</>
								) : (
									"Tukarkan"
								)}
							</Button>
						</form>
					</div>
				</div>
			</Card>

			<Dialog
				open={!!successData}
				onOpenChange={(open) => {
					if (!open) setSuccessData(null);
				}}
			>
				<DialogContent className="max-w-sm text-center">
					<div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-amber-100">
						<span className="text-3xl" role="img" aria-label="trophy">
							🏆
						</span>
					</div>
					<DialogHeader className="text-center">
						<DialogTitle className="text-xl">Selamat! Kamu Sekarang Premium 🎉</DialogTitle>
						<DialogDescription className="mt-2">
							{successData && (
								<>
									Akun Premium kamu aktif hingga{" "}
									<strong>
										{new Date(successData.premiumExpiresAt).toLocaleDateString("id-ID", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</strong>
									. Nikmati akses penuh ke semua fitur!
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<Button className="mt-2 w-full" onClick={() => setSuccessData(null)} id="referral-success-close-btn">
						Mantap, terima kasih!
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}
