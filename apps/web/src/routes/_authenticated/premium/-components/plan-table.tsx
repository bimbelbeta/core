import { CheckIcon, MinusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { PAYMENTS_ENABLED } from "@/lib/billing-config";
import { formatDateMedium } from "@/lib/format-date";
import { formatRupiah } from "@/lib/formatter";
import { isSubscriptionVariant, type ProductVariant } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export interface Plan {
	slug: string;
	name: string;
	price: string;
	credits: number | null;
	type: "product" | "subscription";
	variant: ProductVariant;
	fixedExpiryMonth?: number | null;
	fixedExpiryDay?: number | null;
	durationDays?: number | null;
}

interface PlanTableProps {
	plans: Plan[];
	isPremium: boolean;
	isPending: boolean;
	onPurchase: (slug: string) => void;
}

function planMeta(plan: Plan) {
	const isPremiumPlan = plan.type === "subscription" || isSubscriptionVariant(plan.variant);

	const validity = (() => {
		if (plan.variant === "fixed_date" && plan.fixedExpiryMonth && plan.fixedExpiryDay) {
			const date = new Date(new Date().getFullYear(), plan.fixedExpiryMonth - 1, plan.fixedExpiryDay);
			return `s.d. ${formatDateMedium(date)}`;
		}
		if (plan.variant === "monthly" && plan.durationDays) return `${plan.durationDays} hari`;
		return null;
	})();

	const perTryout = !isPremiumPlan && plan.credits ? Number.parseFloat(plan.price) / plan.credits : null;

	return { isPremiumPlan, validity, perTryout };
}

function Dash() {
	return <MinusIcon className="text-muted-foreground/40 size-3.5" aria-label="tidak termasuk" />;
}

function Tick() {
	return <CheckIcon className="text-primary size-3.5" weight="bold" aria-label="termasuk" />;
}

export function PlanTable({ plans, isPremium, isPending, onPurchase }: PlanTableProps) {
	const columns = `minmax(10rem,1.1fr) repeat(${plans.length}, minmax(7rem,1fr))`;

	const rows: { label: string; render: (plan: Plan) => React.ReactNode }[] = [
		{
			label: "Akses semua materi",
			render: (plan) => (planMeta(plan).isPremiumPlan ? <Tick /> : <Dash />),
		},
		{
			label: "Tryout tanpa batas",
			render: (plan) => (planMeta(plan).isPremiumPlan ? <Tick /> : <Dash />),
		},
		{
			label: "Pembahasan soal",
			render: (plan) =>
				planMeta(plan).isPremiumPlan ? <Tick /> : <span className="text-muted-foreground text-xs">Per tryout</span>,
		},
		{
			label: "Harga per tryout",
			render: (plan) => {
				const { isPremiumPlan, perTryout } = planMeta(plan);
				return perTryout ? (
					<span className="tabular-nums">{formatRupiah(perTryout)}</span>
				) : isPremiumPlan ? (
					<span className="text-muted-foreground text-xs">Termasuk</span>
				) : null;
			},
		},
		{
			label: "Masa aktif",
			render: (plan) => {
				const { isPremiumPlan, validity } = planMeta(plan);
				return isPremiumPlan ? (validity ?? "—") : "Tanpa kedaluwarsa";
			},
		},
	];

	return (
		<div className="overflow-x-auto">
			<div className="grid min-w-[34rem]" style={{ gridTemplateColumns: columns }}>
				<div className="flex flex-col border-b px-4 py-3">
					<Typography variant="subtitle4">Paket</Typography>
				</div>
				{plans.map((plan) => {
					const { isPremiumPlan, validity } = planMeta(plan);
					const isOwned = isPremium && isPremiumPlan;
					const typeLabel = isPremiumPlan ? "Langganan" : "Kredit";
					return (
						<div
							key={plan.slug}
							className={cn(
								"flex flex-col gap-0.5 border-b border-l px-4 py-3",
								isPremiumPlan && "border-t-primary bg-primary-100 border-t-2",
							)}
						>
							<Typography variant="subtitle4">{plan.name}</Typography>
							<Typography as="p" className="text-lg font-semibold tabular-nums">
								{formatRupiah(plan.price)}
							</Typography>
							<Typography variant="caption">
								{typeLabel} · {validity ?? "sekali bayar"}
							</Typography>
							<Button
								size="sm"
								variant="outline"
								className={cn(
									"mt-2 w-full",
									(!PAYMENTS_ENABLED || isOwned) &&
										"bg-muted/70 text-muted-foreground pointer-events-none border-transparent",
								)}
								isPending={isPending}
								disabled={!PAYMENTS_ENABLED || isOwned || isPending}
								onClick={() => onPurchase(plan.slug)}
							>
								{isOwned ? "Paket aktif" : !PAYMENTS_ENABLED ? "Segera hadir" : isPremiumPlan ? "Langganan" : "Beli"}
							</Button>
						</div>
					);
				})}

				<div className="text-foreground/80 bg-muted/40 col-span-full border-b px-4 py-2 text-[0.8125rem] font-medium">
					Yang kamu dapatkan
				</div>

				{rows.map((row, rowIndex) => (
					<div key={row.label} className="contents">
						<div
							className={cn(
								"text-muted-foreground flex items-center px-4 py-2 text-[0.8125rem]",
								rowIndex < rows.length - 1 && "border-b",
							)}
						>
							{row.label}
						</div>
						{plans.map((plan) => {
							const { isPremiumPlan } = planMeta(plan);
							return (
								<div
									key={plan.slug}
									className={cn(
										"flex min-w-0 items-center justify-center border-l px-4 py-2 text-[0.8125rem]",
										rowIndex < rows.length - 1 && "border-b",
										isPremiumPlan && "bg-primary-100",
									)}
								>
									{row.render(plan)}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
