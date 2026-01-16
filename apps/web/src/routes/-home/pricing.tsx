import { ArrowRightIcon, CheckIcon, MedalIcon, XIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Highlight } from "@/components/ui/highlight";
import { cn } from "@/lib/utils";
import { Heading } from "./-componenets/heading";
import { Subheading } from "./-componenets/subheading";
// import { DATA } from "./data";

export function Pricing() {
	// const { plans } = DATA.pricing;

	return (
		<Container className="items-center gap-8 2xl:max-w-340">
			<div className="space-y-2 text-center *:text-pretty">
				<Subheading>Jangan sampai menyesal pas UTBK.</Subheading>
				<Heading>
					Mulai Simulasi dari<Highlight variant="primary">{" Hari Ini"}</Highlight>
				</Heading>
			</div>

			<div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-6 2xl:grid-cols-4">
				{/*{planEntries.map((plan, index) =>
					index === planEntries.length - 1 ? (
						<PremiumCard key={plan.label} data={plan} />
					) : (
						<BasicCard key={plan.label} data={plan} />
					),
				)}*/}
				<div className="h-96 w-full rounded-default border border-neutral-200 bg-neutral-100 p-4 lg:p-6">a</div>
				<div className="h-96 w-full rounded-default border border-neutral-200 bg-neutral-100 p-4 lg:p-6">a</div>
				<div className="h-96 w-full rounded-default border border-neutral-200 bg-neutral-100 p-4 last:sm:col-span-2 last:sm:mx-auto last:sm:w-80 lg:p-6">
					a
				</div>
			</div>
		</Container>
	);
}

type PlanFeature = {
	readonly label: string;
	readonly status: "included" | "excluded" | "limited";
	readonly value?: string;
};

type PlanData =
	| {
			readonly label: string;
			readonly price_monthly?: string;
			readonly price_full?: string;
			readonly suffix?: string;
			readonly features: readonly PlanFeature[];
			readonly cta: { readonly label: string; readonly url: string };
	  }
	| {
			readonly label: string;
			readonly original_price: string;
			readonly price_now: string;
			readonly suffix?: string;
			readonly features: readonly PlanFeature[];
			readonly cta: { readonly label: string; readonly url: string };
	  };

function _BasicCard({ data }: { data: PlanData }) {
	const isBasicPlan = "price_monthly" in data || "price_full" in data;
	if (!isBasicPlan) return null;

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-b-neutral-200 bg-white shadow-sm"
		>
			{/* Top */}
			<div className="relative h-38 space-y-2 border-neutral-200 border-b p-6">
				<h3 className="font-medium text-base">{data.label}</h3>

				<div>
					{"price_monthly" in data && data.price_monthly && (
						<p className="relative z-1 font-semibold text-sm">
							{data.price_monthly} <span className="font-normal">/ bulan</span>
						</p>
					)}

					{"price_full" in data && data.price_full && (
						<p
							className={cn(
								"relative z-1 text-wrap font-bold text-3xl text-primary-300",
								data.label === "Mentoring Privilege" ? "text-black" : "",
							)}
						>
							{data.price_full}
							{"suffix" in data && data.suffix && (
								<span className="ml-1 font-normal text-black text-sm">{data.suffix}</span>
							)}
						</p>
					)}
				</div>

				<div className="absolute top-0 right-0 z-0 aspect-square h-[140%] translate-x-1/2 -translate-y-1/2 rounded-full bg-tertiary-100" />
			</div>

			{/* Features */}
			<ul className="mt-4 space-y-2 px-6">
				{data.features.map((feature) => (
					<li key={feature.label} className="flex items-center gap-2 text-sm">
						<FeatureIcon status={feature.status} />
						<span className={cn(feature.status === "excluded" && "text-neutral-400 line-through")}>
							{feature.value && `${feature.value} `}
							{feature.label}
						</span>
					</li>
				))}
			</ul>

			<div className="p-6">
				<Link to={data.cta.url as string} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full")}>
					{data.cta.label}
					<ArrowRightIcon size={16} weight="bold" />
				</Link>
			</div>
		</motion.div>
	);
}

function _PremiumCard({ data }: { data: PlanData }) {
	const isPremiumPlan = "original_price" in data && "price_now" in data;
	if (!isPremiumPlan) return null;

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			className="flex flex-col justify-between overflow-hidden rounded-2xl shadow-sm"
		>
			{/* Top */}
			<div className="relative h-38 overflow-hidden bg-primary-300 p-6">
				<div className="absolute top-6 right-6 z-50 flex items-center justify-center rounded-sm bg-primary-100 p-1.25 text-neutral-100 text-sm">
					<p className="-mt-0.75">Paling Lengkap!</p>
				</div>
				<h3 className="font-medium text-base text-white">{data.label}</h3>
				<div className="relative inline-block font-bold text-base text-white">
					{data.original_price}

					<span className="pointer-events-none absolute top-1/2 left-0 h-[2px] w-full -origin-center -rotate-6 bg-red-400" />
				</div>

				<div>
					<p className="relative z-1 font-bold text-3xl text-secondary-200">
						{data.price_now}
						{"suffix" in data && data.suffix && (
							<span className="ml-1 font-normal text-sm text-white">{data.suffix}</span>
						)}
					</p>
					<p className="relative z-1 font-normal text-sm text-white">
						promo <span className="font-bold text-red-100">hemat 80%</span> hanya s.d. 31 Jan
					</p>
				</div>

				<div className="absolute right-0 bottom-0 z-0 aspect-square h-[140%] translate-x-1/2 translate-y-1/2 rounded-full bg-primary-400" />
			</div>

			{/* Features */}
			<ul className="mt-4 space-y-2 px-6">
				{data.features.map((feature) => (
					<li key={feature.label} className="flex items-center gap-2 text-sm">
						<FeatureIcon status={feature.status} />
						<span>
							{feature.value && `${feature.value} `}
							{feature.label}
						</span>
					</li>
				))}
			</ul>

			<div className="p-6">
				<Link
					to={data.cta.url as string}
					className={cn(buttonVariants({ size: "sm", variant: "darkBlue" }), "w-full font-normal")}
				>
					{data.cta.label}
					<ArrowRightIcon size={16} weight="bold" />
				</Link>
			</div>
		</motion.div>
	);
}

function FeatureIcon({ status }: { status: "included" | "excluded" | "limited" }) {
	if (status === "included")
		return (
			<div className="flex size-4 items-center justify-center rounded-full bg-primary-300 p-0.5 text-white">
				<CheckIcon weight="bold" />
			</div>
		);
	if (status === "limited")
		return (
			<div className="flex size-4 items-center justify-center rounded-full bg-secondary-700 p-0.5 text-white">
				<MedalIcon />
			</div>
		);
	return (
		<div className="flex size-4 items-center justify-center rounded-full bg-neutral-500 p-0.5 text-white">
			<XIcon weight="bold" />
		</div>
	);
}
