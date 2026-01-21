import { CheckIcon, XIcon } from "@phosphor-icons/react";
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
		<Container className="max-w-none items-center gap-8">
			<div className="space-y-2 text-center *:text-pretty">
				<Subheading>Jangan sampai menyesal pas UTBK.</Subheading>
				<Heading>
					Mulai Simulasi dari <Highlight variant="secondary">Sekarang</Highlight>
				</Heading>
			</div>

			<div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{/* Card 1: Paket Pemula */}
				<PaketPemulaCard />

				{/* Card 2: Tiket Sobat Beta (Highlighted) */}
				<TiketSobatBetaCard />

				{/* Card 3: Paket Premium */}
				<PaketPremiumCard />
			</div>
		</Container>
	);
}

// New Pricing Card Components

function TiketSobatBetaCard() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col justify-between rounded-default border border-primary-300 bg-linear-to-b from-primary-100 to-primary-400 p-5.75"
		>
			{/* Title */}
			<div className="space-y-2">
				<h3 className="text-base text-neutral-1000">Tiket Sobat Beta</h3>

				{/* Price */}
				<div className="flex items-end gap-1.5">
					<p className="font-bold text-[34px] text-primary-900 leading-12.75">Rp 25.000</p>
					<p className="text-base text-neutral-1000">/Tryout</p>
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
						<div className="flex size-6 items-center justify-center">
							<XIcon size={16} weight="bold" className="shrink-0 text-neutral-1000" />
						</div>
						<span className="text-base text-neutral-1000">Tidak Dapat Materi Kelas</span>
					</li>
				</ul>

				{/* Button */}
				<Link
					to="/register"
					className={cn(
						buttonVariants({ size: "sm" }),
						"w-full bg-primary-900 text-neutral-100 hover:bg-primary-900/90",
					)}
				>
					Klaim 1x Tiket Tryoutmu
				</Link>
			</div>
		</motion.div>
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
					<p className="text-base text-neutral-1000">/Tryout</p>
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

function PaketPemulaCard() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col justify-between rounded-default border border-neutral-200 bg-neutral-100 p-5.75"
		>
			{/* Title */}
			<div className="space-y-2">
				<h3 className="text-base text-neutral-1000">Paket Pemula</h3>

				{/* Price */}
				<p className="font-bold text-[34px] text-neutral-1000 leading-12.75">Gratis</p>

				{/* Special text */}
				<p className="text-base text-neutral-1000">
					Dengan <span className="font-bold">1x Instagram Story</span> Poster Tryout
				</p>
			</div>

			{/* Features */}
			<div className="mt-6 space-y-4.5">
				<ul className="space-y-2">
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Tryout Premium SNBT-UTBK tertentu</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Penilaian IRT Seperti UTBK</span>
					</li>
					<li className="flex items-center gap-2">
						<CheckIcon size={24} weight="bold" className="shrink-0 text-neutral-1000" />
						<span className="text-base text-neutral-1000">Kunci Jawaban</span>
					</li>
					<li className="flex items-center gap-2">
						<div className="flex size-6 items-center justify-center">
							<XIcon size={16} weight="bold" className="shrink-0 text-neutral-1000" />
						</div>
						<span className="text-base text-neutral-1000">Sekali Mengerjakan</span>
					</li>
					<li className="flex items-center gap-2">
						<div className="flex size-6 items-center justify-center">
							<XIcon size={16} weight="bold" className="shrink-0 text-neutral-1000" />
						</div>
						<span className="text-base text-neutral-1000">Terikat Waktu Event</span>
					</li>
					<li className="flex items-center gap-2">
						<div className="flex size-6 items-center justify-center">
							<XIcon size={16} weight="bold" className="shrink-0 text-neutral-1000" />
						</div>
						<span className="text-base text-neutral-1000">Tidak Dapat Materi Kelas</span>
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
