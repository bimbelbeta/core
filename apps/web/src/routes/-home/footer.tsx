import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { DATA } from "./data";

const BACKGROUND_IMAGE = "https://www.figma.com/api/mcp/asset/b950a8fd-3b00-4c89-80f4-462a8b67eaf0";

export default function Footer() {
	return (
		<footer className="relative overflow-hidden">
			{/* Background Image */}
			<div className="pointer-events-none absolute inset-0 opacity-20">
				<img src={BACKGROUND_IMAGE} alt="" className="absolute inset-0 size-full object-cover" />
			</div>

			{/* CTA Section */}
			<div className="relative z-10 flex flex-col items-center gap-7 px-4 py-16 pb-20">
				<div className="flex flex-col items-center gap-7 text-center">
					{/* Heading */}
					<h2 className="font-bold text-[34px] text-neutral-1000 leading-[51px]">
						Satu <span className="text-secondary-700">Langkah Kecil</span> Menuju
						<br />
						Kampus <span className="text-secondary-700">Impianmu!</span>
					</h2>

					{/* Subheading */}
					<p className="text-base text-neutral-1000 leading-6">
						Ribuan pesaingmu sudah mulai belajar hari ini.
						<br />
						Jangan sampai kamu tertinggal.
					</p>
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

			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary-400 via-primary-200 to-transparent" />

			{/* Footer Content */}
			<div className="relative z-10 px-10 py-10">
				<Container className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2.5">
							<div className="size-[62px] rounded-xl bg-neutral-200" />
							<h3 className="font-medium text-neutral-1000 text-xl">Bimbel Beta</h3>
						</div>
						<p className="text-base text-neutral-1000 leading-6">Lorem ipsum dolor sit amet,</p>
					</div>
					<div className="mt-6 flex flex-col items-center justify-end gap-5 sm:mt-0 sm:items-end">
						<div className="flex items-center gap-4">
							{DATA.footer.socials.map((social) => (
								<a
									key={social.label}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									className={cn(buttonVariants({ size: "icon" }), "bg-secondary-700 hover:bg-secondary-700/90")}
								>
									<social.icon className="size-5" weight="bold" />
								</a>
							))}
						</div>
						<div className="flex items-center gap-3 text-base text-neutral-1000">
							Build together with{" "}
							<a
								href="https://www.instagram.com/omahti_ugm"
								className="flex items-center gap-2 hover:opacity-80"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/OmahTI.webp"
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
