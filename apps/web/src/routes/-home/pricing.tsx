import { CheckIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Highlight } from "@/components/ui/highlight";
import { Typography } from "@/components/ui/typography";
import { formatRupiah } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { HOME_PAGE_CONTENT } from "./data";

export function Pricing() {
	return (
		<Container className="max-w-7xl items-center gap-8 py-30">
			<div className="text-center *:text-pretty">
				<Typography variant="subtitle1" as="p">
					Jangan sampai menyesal pas UTBK.
				</Typography>
				<Typography variant="display" as="h2">
					Mulai Simulasi dari <Highlight variant="secondary">Sekarang</Highlight>
				</Typography>
			</div>

			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{HOME_PAGE_CONTENT.pricing.programs.map((item) => (
						<ProgramPricingCard key={item.id} {...item} />
					))}
				</div>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
					{HOME_PAGE_CONTENT.pricing.tryouts.map((item) => (
						<TryoutPricingCard key={item.id} {...item} />
					))}
				</div>
			</div>
		</Container>
	);
}

type ProgramPricingProps = {
	title: string;
	price: number;
	originalPrice?: number;
	period?: string;
	features: readonly string[];
	variant?: "default" | "highlight";
};

function ProgramPricingCard({
	title,
	price,
	originalPrice,
	period,
	features,
	variant = "default",
}: ProgramPricingProps) {
	return (
		<Card variant="flush" className="rounded-default h-full border-neutral-200 bg-neutral-100 p-6 shadow-none">
			<div className="mb-6">
				<Typography variant="subtitle2">{title}</Typography>

				<div className="flex flex-wrap items-center gap-x-3">
					{originalPrice && (
						<Typography variant="display" as="span" className="relative inline-block text-neutral-400">
							{formatRupiah(originalPrice)}

							<span className="-origin-center pointer-events-none absolute top-1/2 left-0 h-1 w-full rotate-6 bg-red-400" />
						</Typography>
					)}

					<Typography
						variant="display"
						as="p"
						className={variant === "highlight" ? "text-secondary-700" : "text-neutral-900"}
					>
						{formatRupiah(price)}
						{period && <span className="text-base font-normal">{period}</span>}
					</Typography>
				</div>
			</div>

			<ul className="mb-6 grid flex-1 grid-cols-1 xl:grid-cols-2">
				{features.map((f) => (
					<li key={f} className="items-items-start flex gap-2">
						<CheckIcon size={16} weight="bold" className="mt-1 shrink-0" />
						<span>{f}</span>
					</li>
				))}
			</ul>

			<div className="mt-auto">
				<Link to="/register" className={cn(buttonVariants(), "w-full")}>
					Daftar Akun
				</Link>
			</div>
		</Card>
	);
}

type TryoutPricingProps = {
	title: string;
	price: number;
	features: readonly string[];
};

function TryoutPricingCard({ title, price, features }: TryoutPricingProps) {
	return (
		<Card variant="flush" className="rounded-default space-y-4 border-neutral-200 bg-neutral-100 p-5 shadow-none">
			<div>
				<Typography variant="body" as="h3" className="font-medium">
					{title}
				</Typography>
				<Typography variant="title" as="p">
					{formatRupiah(price)}
				</Typography>
			</div>

			<ul className="space-y-1">
				{features.map((f) => (
					<li key={f} className="flex items-center gap-2 text-sm">
						<CheckIcon size={12} weight="bold" />
						<span>{f}</span>
					</li>
				))}
			</ul>

			<Link to="/register" className={cn(buttonVariants({ size: "sm" }), "w-full")}>
				Daftar Akun
			</Link>
		</Card>
	);
}
