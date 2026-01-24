import { PREMIUM_DEADLINE } from "@bimbelbeta/api/lib/constants";
import { Coins, InfinityIcon, SparkleIcon, SpinnerIcon, StarIcon, Ticket } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { createMeta } from "@/lib/seo-utils";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

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

const features = [
	{
		icon: <InfinityIcon size={24} />,
		title: "Akses Tanpa Batas",
		description: "Buka semua materi latihan tanpa batasan apapun",
	},
	{
		icon: <SparkleIcon size={24} />,
		title: "Tips & Trik Eksklusif",
		description: "Dapatkan strategi rahasia yang tidak tersedia di paket gratis",
	},
	{
		icon: <StarIcon size={24} />,
		title: "Komunitas Premium",
		description: "Bergabung dengan grup diskusi eksklusif untuk pengguna premium",
	},
];

function formatPrice(price: string | number) {
	const num = typeof price === "string" ? Number.parseFloat(price) : price;
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num);
}

function PremiumHeader({ creditBalance }: { creditBalance: number }) {
	return (
		<div className="relative overflow-hidden rounded-[10px] bg-primary-300 text-white">
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
						src="/avatar/premium-pricing-card-avatar.webp"
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

interface PackageCardProps {
	name: string;
	slug: string;
	price: string;
	credits: number | null;
	isSubscription: boolean;
	isPurchased?: boolean;
	isPending: boolean;
	onPurchase: (slug: string) => void;
	disabled?: boolean;
}

function PackageCard({
	name,
	slug,
	price,
	credits,
	isSubscription,
	isPurchased,
	isPending,
	onPurchase,
	disabled,
}: PackageCardProps) {
	const isPremiumPackage = slug === "premium";

	return (
		<Card
			className={cn(
				"relative overflow-hidden border-2 bg-white p-6 shadow-lg transition-all hover:shadow-xl",
				isPremiumPackage ? "border-primary-200 ring-2 ring-primary-100" : "border-neutral-200",
			)}
		>
			{isPremiumPackage && (
				<Badge className="absolute top-4 right-4 bg-primary-500 text-white hover:bg-primary-500">Terlaris</Badge>
			)}

			<div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary-100 opacity-50 blur-2xl" />

			<div className="relative z-10 flex items-center gap-3">
				{isSubscription ? (
					<div className="rounded-full bg-primary-100 p-2 text-primary-500">
						<StarIcon size={24} weight="fill" />
					</div>
				) : (
					<div className="rounded-full bg-amber-100 p-2 text-amber-600">
						<Ticket size={24} weight="fill" />
					</div>
				)}
				<h3 className="font-semibold text-lg text-neutral-1000">{name}</h3>
			</div>

			<div className="relative z-10 mt-4 flex items-baseline gap-1">
				<span className={cn("font-bold text-2xl", isPremiumPackage ? "text-primary-500" : "text-neutral-900")}>
					{formatPrice(price)}
				</span>
				{isSubscription && <span className="text-neutral-500 text-sm">s.d. UTBK</span>}
			</div>

			<p className="relative z-10 mt-2 text-neutral-600 text-sm">
				{isSubscription ? (
					"Akses penuh ke semua materi, tryout tanpa batas, dan fitur eksklusif."
				) : (
					<>
						<span className="font-semibold text-amber-600">{credits}x</span> kredit tryout untuk memulai tryout
						pilihanmu.
					</>
				)}
			</p>

			{credits && credits > 1 && (
				<div className="relative z-10 mt-2">
					<span className="text-green-600 text-xs">Hemat {formatPrice(Number.parseFloat(price) / credits)}/tryout</span>
				</div>
			)}

			<Button
				size="lg"
				variant={isPremiumPackage ? "default" : "outline"}
				className="relative z-10 mt-6 w-full hover:cursor-pointer"
				disabled={isPurchased || isPending || disabled}
				onClick={() => onPurchase(slug)}
			>
				{isPurchased ? (
					"Sudah Dimiliki"
				) : isPending ? (
					<>
						<SpinnerIcon className="animate-spin" />
						Memproses...
					</>
				) : (
					"Beli Sekarang"
				)}
			</Button>
		</Card>
	);
}

function PackagesSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{[1, 2, 3].map((i) => (
				<Card key={i} className="p-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<Skeleton className="h-6 w-32" />
					</div>
					<Skeleton className="mt-4 h-8 w-24" />
					<Skeleton className="mt-2 h-4 w-full" />
					<Skeleton className="mt-6 h-10 w-full" />
				</Card>
			))}
		</div>
	);
}

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const transactionMutation = useMutation(orpc.transaction.subscribe.mutationOptions());
	const queryClient = useQueryClient();
	const [token, setToken] = useState<string | undefined>();

	// Fetch credit balance
	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());

	// Fetch available packages
	const packagesQuery = useQuery(orpc.credit.packages.queryOptions());

	useEffect(() => {
		const midtransScriptUrl = import.meta.env.PROD
			? "https://app.midtrans.com/snap/snap.js"
			: "https://app.sandbox.midtrans.com/snap/snap.js";
		const scriptTag = document.createElement("script");
		scriptTag.src = midtransScriptUrl;
		const myMidtransClientKey = (process.env.MIDTRANS_CLIENT_KEY ?? import.meta.env.MIDTRANS_CLIENT_KEY) || "";
		scriptTag.setAttribute("data-client-key", myMidtransClientKey);
		document.body.appendChild(scriptTag);
		return () => {
			document.body.removeChild(scriptTag);
		};
	}, []);

	useEffect(() => {
		if (token) {
			// @ts-expect-error - Midtrans Snap is loaded globally
			window.snap.pay(token, {
				onSuccess: () => {
					toast.success("Pembayaran berhasil!");
					queryClient.invalidateQueries();
				},
				onPending: () => {
					toast.info("Menunggu pembayaran...");
				},
				onError: () => {
					toast.error("Pembayaran gagal. Silakan coba lagi.");
				},
				onClose: () => {
					toast.warning("Pembayaran dibatalkan.");
				},
			});
		}
	}, [token, queryClient]);

	const handlePurchase = async (slug: string) => {
		try {
			const data = await transactionMutation.mutateAsync({ slug });
			setToken(data.token);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error("Terjadi kesalahan. Silakan coba lagi.");
			}
		}
	};

	const isPremium = session?.user.isPremium;
	const isPastDueDate = Date.now() > PREMIUM_DEADLINE.getTime();
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	// Combine premium subscription with credit packages
	const allPackages = [
		// Premium subscription (hardcoded since it's a subscription, not from credit packages)
		{
			id: "premium",
			name: "Paket Premium",
			slug: "premium",
			price: "199000",
			credits: null,
			isSubscription: true,
		},
		// Credit packages from API
		...(packagesQuery.data?.map((pkg) => ({
			...pkg,
			isSubscription: false,
		})) ?? []),
	];

	return (
		<Container className="space-y-8">
			<PremiumHeader creditBalance={creditBalance} />

			<div className="space-y-6">
				<div>
					<h2 className="mb-2 font-bold text-neutral-1000 text-xl">Pilih Paket</h2>
					<p className="text-neutral-600 text-sm">
						Pilih paket yang sesuai dengan kebutuhanmu. Premium untuk akses penuh, atau beli kredit tryout satuan.
					</p>
				</div>

				{packagesQuery.isLoading ? (
					<PackagesSkeleton />
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{allPackages.map((pkg) => (
							<PackageCard
								key={pkg.slug}
								name={pkg.name}
								slug={pkg.slug}
								price={pkg.price}
								credits={pkg.credits}
								isSubscription={pkg.isSubscription}
								isPurchased={pkg.slug === "premium" && isPremium}
								isPending={transactionMutation.isPending}
								onPurchase={handlePurchase}
								disabled={pkg.slug === "premium" && isPastDueDate}
							/>
						))}
					</div>
				)}
			</div>

			<div className="space-y-6">
				<div>
					<h2 className="mb-4 font-bold text-neutral-1000 text-xl">Keuntungan Premium</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<Card key={feature.title} className="border-neutral-200 p-4">
								<div className="flex items-start gap-4">
									<div className="shrink-0 rounded-full bg-primary-100 p-2 text-primary-500">{feature.icon}</div>
									<div>
										<h3 className="font-semibold text-neutral-1000">{feature.title}</h3>
										<p className="mt-1 text-neutral-600 text-sm">{feature.description}</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				</div>
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
