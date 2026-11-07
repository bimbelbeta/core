import { Image } from "@unpic/react";
import { Container } from "@/components/ui/container";
import { Typography } from "@/components/ui/typography";

export function Features() {
	return (
		<section className="bg-background overflow-x-hidden pb-20 xl:pb-40">
			<Container className="py-0">
				<Typography variant="display" as="h2" className="text-center">
					<span className="text-secondary-700 font-semibold">Bimbel Beta</span> Punya Solusinya
				</Typography>
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
					<FeatureOne />
					<FeatureTwo />
					<FeatureThree />
				</div>
			</Container>
		</section>
	);
}

function FeatureOne() {
	return (
		<div className="via-primary-100 to-primary-300/80 relative h-70 w-full rounded-xl border border-neutral-200 bg-linear-to-t from-neutral-100 via-66% p-5 text-center min-[490px]:mx-auto min-[490px]:max-w-[420px] md:mx-0 md:max-w-none md:p-6">
			<Typography variant="subtitle1" as="h3">
				{" "}
				<span className="text-primary-900 font-semibold">Latihan Soal</span> dengan{" "}
				<span className="text-primary-900 font-semibold">Feedback</span> Instan!
			</Typography>
			<Typography variant="body">Jawab dan langsung dapat nilai serta pembahasan ringkas.</Typography>

			<Image
				src="/images/home/img-feature-1.webp"
				width={150}
				height={150}
				className="absolute bottom-0 left-1/2 w-[80%] -translate-x-1/2 lg:w-full 2xl:w-[80%]"
			/>
		</div>
	);
}

function FeatureTwo() {
	return (
		<div className="via-primary-100 to-primary-300/80 relative h-70 w-full rounded-xl border border-neutral-200 bg-linear-to-t from-neutral-100 via-66% p-5 text-center min-[490px]:mx-auto min-[490px]:max-w-[420px] md:mx-0 md:max-w-none md:p-6">
			<Typography variant="subtitle1" as="h3">
				Simulasi <span className="text-primary-900 font-semibold">UTBK & Ranking</span> Nasional{" "}
				<span className="text-primary-900 font-semibold">Feedback</span> Instan!
			</Typography>
			<Typography variant="body">
				Ukur kesiapanmu lewat Tryout terjadwal. Cek posisimu di antara pesaing dari seluruh sekolah.
			</Typography>

			<Image
				src="/images/home/img-feature-2.webp"
				width={150}
				height={150}
				className="absolute bottom-0 left-1/2 w-full -translate-x-1/2"
			/>
		</div>
	);
}

function FeatureThree() {
	return (
		<div className="via-primary-100 to-primary-300/80 relative h-70 w-full rounded-xl border border-neutral-200 bg-linear-to-r from-neutral-100 via-66% p-5 text-center min-[490px]:mx-auto min-[490px]:max-w-[420px] md:mx-0 md:max-w-none md:p-6 last:md:col-span-2 last:md:text-left">
			<Typography variant="subtitle1" as="h3" className="md:max-w-xs">
				<span className="text-primary-900 font-semibold">Materi Video & Modul</span> yang Terstruktur Rapi
			</Typography>
			<Typography variant="body" className="md:mt-2 md:max-w-xs">
				Tak perlu bingung mulai dari mana. Akses video teori dan rangkuman yang disusun urut per topik dalam satu
				dashboard.
			</Typography>

			<Image
				src="/images/home/img-feature-3.webp"
				width={150}
				height={150}
				className="absolute right-0 bottom-0 left-3 w-full md:right-0 md:left-auto md:w-1/2"
			/>
		</div>
	);
}
