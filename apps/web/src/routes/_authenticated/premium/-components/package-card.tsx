import { CheckIcon, SpinnerIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { PAYMENTS_COMING_SOON_LABEL, PAYMENTS_ENABLED } from "@/lib/billing-config";
import { formatDateMedium } from "@/lib/format-date";
import { formatRupiah } from "@/lib/formatter";
import { cn } from "@/lib/utils";

interface PackageCardProps {
	name: string;
	slug: string;
	price: string;
	credits: number | null;
	variant: "fixed_date" | "monthly" | "credits";
	fixedExpiryMonth?: number | null;
	fixedExpiryDay?: number | null;
	durationDays?: number | null;
	isPurchased?: boolean;
	isPending: boolean;
	onPurchase: (slug: string) => void;
	disabled?: boolean;
}

export function PackageCard({
	name,
	slug,
	price,
	credits,
	variant,
	fixedExpiryMonth,
	fixedExpiryDay,
	durationDays,
	isPurchased,
	isPending,
	onPurchase,
	disabled,
}: PackageCardProps) {
	const isPremiumPackage = variant === "fixed_date" || variant === "monthly";
	const isCreditsPackage = variant === "credits";

	const premiumSubtitle = (() => {
		if (variant === "fixed_date" && fixedExpiryMonth && fixedExpiryDay) {
			const displayYear = new Date().getFullYear();
			const date = new Date(displayYear, fixedExpiryMonth - 1, fixedExpiryDay);
			return `s.d. ${formatDateMedium(date)}`;
		}

		if (variant === "monthly" && durationDays) {
			return `${durationDays} hari`;
		}

		return null;
	})();

	return (
		<Card
			variant="flush"
			className={cn(
				"rounded-default h-full border-neutral-200 bg-neutral-100 p-6 shadow-none",
				isPremiumPackage && "ring-primary-100 ring-2",
			)}
		>
			{isPremiumPackage && (
				<div className="bg-primary-100 mb-4 inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1">
					<span className="text-primary-700 text-xs font-medium">Premium</span>
				</div>
			)}

			<div className="mb-4">
				<Typography variant={isPremiumPackage ? "subtitle1" : "subtitle2"} as="h3">
					{name}
				</Typography>

				<div className="flex flex-wrap items-center gap-x-2">
					<Typography
						variant={isPremiumPackage ? "title" : "subtitle1"}
						as="p"
						className={isPremiumPackage ? "text-primary-600" : "text-neutral-900"}
					>
						{formatRupiah(price)}
					</Typography>
					{isPremiumPackage && premiumSubtitle && <span className="text-sm text-neutral-800">{premiumSubtitle}</span>}
				</div>
			</div>

			<Typography className="mb-4 text-neutral-800">
				{isPremiumPackage ? (
					"Akses penuh ke semua materi, tryout tanpa batas, dan fitur eksklusif."
				) : (
					<>
						<span className="font-semibold text-amber-600">{credits}x</span> kredit tryout untuk memulai tryout
						pilihanmu.
					</>
				)}
			</Typography>

			{credits && credits > 1 && isCreditsPackage && (
				<div className="mb-4">
					<div className="flex items-center gap-1 text-xs text-green-700">
						<CheckIcon size={12} weight="bold" />
						<span>Hemat {formatRupiah(Number.parseFloat(price) / credits)}/tryout</span>
					</div>
				</div>
			)}

			{isPremiumPackage && credits && credits > 0 && (
				<div className="mb-4">
					<div className="flex items-center gap-1 text-xs text-green-700">
						<CheckIcon size={12} weight="bold" />
						<span>Bonus: {credits} kredit tryout</span>
					</div>
				</div>
			)}

			<Button
				size={isPremiumPackage ? "lg" : "default"}
				variant={isPremiumPackage ? "default" : "outline"}
				className="mt-auto w-full hover:cursor-pointer"
				disabled={!PAYMENTS_ENABLED || isPurchased || isPending || disabled}
				onClick={() => onPurchase(slug)}
			>
				{!PAYMENTS_ENABLED ? (
					PAYMENTS_COMING_SOON_LABEL
				) : isPurchased ? (
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
