import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import * as m from "motion/react-m";
import { MotionFloat } from "@/components/motion/motion-components";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/ui/highlight";
import { Typography } from "@/components/ui/typography";

/*
  [clip-path:polygon(0_0,100%_0,100%_70%,50%_85%,0%_70%)]
  Sudut = 85%
  Horizontal position = 50%
  Tinggi garis = 70%
*/

const MotionTypography = m.create(Typography);

export function Hero() {
	return (
		<section className="via-primary-100 to-primary-300/80 relative mx-auto flex w-full flex-col items-center justify-start overflow-hidden bg-radial from-neutral-100 via-66% pt-20 [clip-path:polygon(0_0,100%_0,100%_85%,50%_100%,0%_85%)] *:max-w-5xl">
			<div className="container mx-auto flex max-w-5xl shrink-0 flex-col items-center px-4 pt-8 md:pt-20">
				<div className="flex flex-col items-center gap-3 text-center md:gap-4">
					<MotionTypography
						variant="hero"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0 }}
					>
						Rumah Baru untuk{" "}
						<Highlight variant="darkBlue" weight={"bold"}>
							Persiapan UTBK-mu,
						</Highlight>{" "}
						<br className="hidden lg:block" />
						<Highlight variant="darkBlue" weight={"bold"}>
							Satu Tempat
						</Highlight>{" "}
						untuk{" "}
						<Highlight variant="darkBlue" weight={"bold"}>
							Semua
						</Highlight>{" "}
						Targetmu!
					</MotionTypography>

					<MotionTypography
						variant="body"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
						className="max-w-sm md:max-w-lg"
					>
						Nikmati ekosistem lengkap dari materi hingga simulasi ujian di satu tempat. Kamu fokus belajar biar kami
						yang atur sistemnya.
					</MotionTypography>

					<m.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.2 }}
						className="flex w-full flex-wrap items-center justify-center gap-2 *:max-sm:text-xs"
					>
						<div>
							<Button asChild size="lg" className="flex-1 px-3 sm:w-auto sm:flex-initial">
								<Link to="/login">
									Mulai Perjalananmu <ArrowRightIcon size={20} weight="bold" />
								</Link>
							</Button>
						</div>
						<div>
							<Button variant="white" size="lg" className="flex-1 px-3 sm:w-auto sm:flex-initial">
								<Link to="/dashboard">Pelajari Tentang Bimbel Beta</Link>
							</Button>
						</div>
					</m.div>
				</div>
			</div>

			<MotionFloat delay={0.3}>
				<Image src="/images/home/Hero Image.png" alt="Hero Illustration" layout="fullWidth" className="" />
			</MotionFloat>
		</section>
	);
}
