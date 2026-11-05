import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { HOME_PAGE_CONTENT } from "./data";

const BACKGROUND_IMAGE = "/footer.png";

export default function Footer() {
	return (
		<footer className="relative overflow-hidden">
			{/* Background Image */}
			<div className="pointer-events-none absolute inset-0 opacity-20">
				<Image
					src={BACKGROUND_IMAGE}
					alt="background"
					width={500}
					height={500}
					className="absolute inset-0 size-full object-cover object-top xl:-translate-y-[10%]"
				/>
			</div>

			{/* CTA Section */}
			<div className="relative z-10 flex flex-col items-center gap-7 px-4 py-20">
				<div className="flex flex-col items-center text-center">
					{/* Heading */}
					<Typography variant="display" as="h2" className="text-neutral-1000">
						Satu <span className="text-secondary-700 font-bold">Langkah Kecil</span> Menuju
						<br className="hidden sm:block" /> Kampus <span className="text-secondary-700 font-bold">Impianmu!</span>
					</Typography>

					{/* Subheading */}
					<Typography variant="body" className="text-neutral-1000 mt-2 max-w-xs text-pretty md:max-w-md">
						Ribuan pesaingmu sudah mulai belajar hari ini.
						<br className="hidden sm:block" /> Jangan sampai kamu tertinggal.
					</Typography>
				</div>

				{/* CTA Button */}
				<Button asChild className="gap-2">
					<Link to="/login">
						Mulai Bersama Bimbel Beta
						<ArrowRightIcon size={20} weight="bold" />
					</Link>
				</Button>

				{/* Gradient Decoration */}
			</div>

			<div className="from-primary-400 via-primary-200 pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t to-transparent" />

			{/* Footer Content */}
			<div className="relative z-10 px-10 pt-30 pb-10">
				<Container className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2.5">
							<Typography variant="title" as="h3" className="text-neutral-1000 w-full text-center sm:text-left">
								<span className="text-secondary-900">Bimbel</span> <span className="text-tertiary-1000">Beta</span>
							</Typography>
						</div>
						<Typography variant="body" className="text-neutral-1000 text-center sm:text-left">
							PT Beta Solusi Edukasi
						</Typography>
					</div>
					<div className="mt-6 flex flex-col items-center justify-end gap-5 sm:mt-0 sm:items-end">
						<div className="flex items-center gap-4">
							{HOME_PAGE_CONTENT.footer.socials.map((social) => (
								<a
									key={social.label}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={social.label}
									className={cn(buttonVariants({ size: "icon" }), "bg-secondary-800 hover:bg-secondary-900")}
								>
									<social.icon className="size-5" weight="bold" />
								</a>
							))}
						</div>
						<div className="text-neutral-1000 flex items-center gap-3 text-base">
							Build together with{" "}
							<a
								href="https://www.instagram.com/omahti_ugm"
								className="flex items-center gap-2 hover:opacity-80"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									// src="/icons/OmahTI.webp"
									src="/omahti.svg"
									alt="OmahTI"
									width={111}
									height={15}
									sizes="60%"
									className="h-2.5 w-auto md:h-3"
								/>
							</a>
						</div>
					</div>
				</Container>
			</div>
		</footer>
	);
}
