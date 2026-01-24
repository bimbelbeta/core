import { CheckIcon } from "@phosphor-icons/react";
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
	return (
		<Container className="max-w-none items-center gap-8 py-30">
			<div className="space-y-2 text-center *:text-pretty">
				<Subheading>Jangan sampai menyesal pas UTBK.</Subheading>
				<Heading>
					Mulai Simulasi dari <Highlight variant="secondary">Sekarang</Highlight>
				</Heading>
			</div>

			<div className="">
				{/* Card 3: Paket Premium */}
				<PaketPremiumCard />
			</div>
		</Container>
	);
}

function PaketPremiumCard() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col justify-between rounded-default border border-neutral-200 bg-neutral-100 p-5.75"
		>
			{/* Title */}
			<div className="space-y-2">
				<h3 className="text-base text-neutral-1000">Paket Premium</h3>

				{/* Price */}
				<div className="flex items-end gap-1.5">
					<p className="font-bold text-[34px] text-neutral-1000 leading-12.75">Rp 25.000</p>
				</div>
			</div>

			{/* Features */}
			<div className="mt-6 space-y-4.5">
				<ul className="space-y-2">
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Tryout Premium SNBT-UTBK</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Pembahasan Lengkap</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Penilaian IRT Seperti UTBK</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Ranking Nasional</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Bisa Pengerjaan Ulang</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Kerjakan Kapan Saja</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Akses Materi Kelas</span>
					</li>
				</ul>

				{/* Button */}
				<Link to="/register" className={cn(buttonVariants({ size: "sm" }), "w-full")}>
					Daftar Akun
				</Link>
			</div>
		</motion.div>
	);
}
