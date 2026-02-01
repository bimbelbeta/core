import { CheckIcon, SpinnerIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRupiah } from "../utils";

interface PackageCardProps {
	name: string;
	slug: string;
	price: string;
	credits: number | null;
	variant: "fixed_date" | "monthly" | "credits";
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
	isPurchased,
	isPending,
	onPurchase,
	disabled,
}: PackageCardProps) {
	const isPremiumPackage = variant === "fixed_date" || variant === "monthly";
	const isCreditsPackage = variant === "credits";

	return (
		<div
			className={cn(
				"flex h-full flex-col rounded-default border border-neutral-200 bg-neutral-100 p-6",
				isPremiumPackage && "ring-2 ring-primary-100",
			)}
		>
			{isPremiumPackage && (
				<div className="mb-4 inline-flex items-center gap-1.5 self-start rounded-full bg-primary-100 px-3 py-1">
					<span className="font-medium text-primary-700 text-xs">Premium</span>
				</div>
			)}

			<div className="mb-4">
				<h3 className={cn("font-medium", isPremiumPackage ? "text-lg" : "text-base")}>{name}</h3>

				<div className="flex flex-wrap items-center gap-x-2">
					<p className={cn("font-bold", isPremiumPackage ? "text-2xl text-primary-600" : "text-neutral-900 text-xl")}>
						{formatRupiah(price)}
					</p>
					{isPremiumPackage && <span className="text-neutral-500 text-sm">s.d. UTBK</span>}
				</div>
			</div>

			<p className="mb-4 text-neutral-600 text-sm">
				{isPremiumPackage ? (
					"Akses penuh ke semua materi, tryout tanpa batas, dan fitur eksklusif."
				) : (
					<>
						<span className="font-semibold text-amber-600">{credits}x</span> kredit tryout untuk memulai tryout
						pilihanmu.
					</>
				)}
			</p>

			{credits && credits > 1 && isCreditsPackage && (
				<div className="mb-4">
					<div className="flex items-center gap-1 text-green-600 text-xs">
						<CheckIcon size={12} weight="bold" />
						<span>Hemat {formatRupiah(Number.parseFloat(price) / credits)}/tryout</span>
					</div>
				</div>
			)}

			{isPremiumPackage && credits && credits > 0 && (
				<div className="mb-4">
					<div className="flex items-center gap-1 text-green-600 text-xs">
						<CheckIcon size={12} weight="bold" />
						<span>Bonus: {credits} kredit tryout</span>
					</div>
				</div>
			)}

			<Button
				size={isPremiumPackage ? "lg" : "default"}
				variant={isPremiumPackage ? "default" : "outline"}
				className="mt-auto w-full hover:cursor-pointer"
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
		</div>
	);
}
