import { CheckIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Highlight } from "@/components/ui/highlight";
import { cn } from "@/lib/utils";
import { Heading } from "./-componenets/heading";
import { Subheading } from "./-componenets/subheading";
import { DATA } from "./data";

export function formatRupiah(value: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(value);
}

export function Pricing() {
	return (
		<Container className="max-w-7xl items-center gap-8 py-30">
			<div className="text-center *:text-pretty">
				<Subheading>Jangan sampai menyesal pas UTBK.</Subheading>
				<Heading>
					Mulai Simulasi dari <Highlight variant="secondary">Sekarang</Highlight>
				</Heading>
			</div>

			<div className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2">
					{DATA.pricing.programs.map((item) => (
						<ProgramPricingCard key={item.id} {...item} />
					))}
				</div>

				<div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
					{DATA.pricing.tryouts.map((item) => (
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
		<div
			className={cn(
				"space-y-6 rounded-default border p-6",
				variant === "highlight" ? "border-primary bg-primary/5" : "border-neutral-200 bg-neutral-100",
			)}
		>
			<div>
				<h3 className="font-medium text-base">{title}</h3>

				{originalPrice && <p className="text-neutral-500 text-sm line-through">{formatRupiah(originalPrice)}</p>}

				<p className="font-bold text-3xl">
					{formatRupiah(price)}
					{period && <span className="font-normal text-base">{period}</span>}
				</p>
			</div>

			<ul className="grid flex-1 grid-cols-1 xl:grid-cols-2">
				{features.map((f) => (
					<li key={f} className="items-items-start flex gap-2">
						<CheckIcon size={16} weight="bold" className="mt-1 shrink-0" />
						<span>{f}</span>
					</li>
				))}
			</ul>

			<div className="mt-auto mb-0 w-full">
				<Link to="/register" className={cn(buttonVariants(), "w-full")}>
					Daftar Akun
				</Link>
			</div>
		</div>
	);
}

type TryoutPricingProps = {
	title: string;
	price: number;
	features: readonly string[];
};

function TryoutPricingCard({ title, price, features }: TryoutPricingProps) {
	return (
		<div className="space-y-4 rounded-default border border-neutral-200 bg-neutral-100 p-5">
			<div>
				<h3 className="font-medium text-sm">{title}</h3>
				<p className="font-bold text-xl">{formatRupiah(price)}</p>
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
		</div>
	);
}
