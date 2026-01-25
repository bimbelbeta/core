import { Image } from "@unpic/react";
import { Container } from "@/components/ui/container";
import { Heading } from "./-componenets/heading";
import { Subheading } from "./-componenets/subheading";

export function Features() {
	return (
		<section className="overflow-x-hidden bg-background pb-20 xl:pb-40">
			<Container className="py-0">
				<Heading>
					<span className="font-semibold text-secondary-700">Bimbel Beta</span> Punya Solusinya
				</Heading>
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
		<div className="relative h-70 w-full rounded-xl border border-neutral-200 bg-linear-to-t from-neutral-100 via-66% via-primary-100 to-primary-300/80 p-5 text-center md:mx-0 md:max-w-none md:p-6 min-[490px]:mx-auto min-[490px]:max-w-[420px]">
			<Subheading>
				{" "}
				<span className="font-semibold text-primary-900">Latihan Soal</span> dengan{" "}
				<span className="font-semibold text-primary-900">Feedback</span> Instan!
			</Subheading>
			<p className="text-sm">Jawab dan langsung dapat nilai serta pembahasan ringkas.</p>

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
		<div className="relative h-70 w-full rounded-xl border border-neutral-200 bg-linear-to-t from-neutral-100 via-66% via-primary-100 to-primary-300/80 p-5 text-center md:mx-0 md:max-w-none md:p-6 min-[490px]:mx-auto min-[490px]:max-w-[420px]">
			<Subheading>
				Simulasi <span className="font-semibold text-primary-900">UTBK & Ranking</span> Nasional{" "}
				<span className="font-semibold text-primary-900">Feedback</span> Instan!
			</Subheading>
			<p className="text-sm">
				Ukur kesiapanmu lewat Tryout terjadwal. Cek posisimu di antara pesaing dari seluruh sekolah.
			</p>

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
		<div className="relative h-70 w-full rounded-xl border border-neutral-200 bg-linear-to-r from-neutral-100 via-66% via-primary-100 to-primary-300/80 p-5 text-center md:mx-0 md:max-w-none md:p-6 last:md:col-span-2 last:md:text-left min-[490px]:mx-auto min-[490px]:max-w-[420px]">
			<Subheading className="md:max-w-xs">
				<span className="font-semibold text-primary-900">Materi Video & Modul</span> yang Terstruktur Rapi
			</Subheading>
			<p className="text-sm md:mt-2 md:max-w-xs">
				Tak perlu bingung mulai dari mana. Akses video teori dan rangkuman yang disusun urut per topik dalam satu
				dashboard.
			</p>

			<Image
				src="/images/home/img-feature-3.webp"
				width={150}
				height={150}
				className="absolute right-0 bottom-0 left-3 w-full md:right-0 md:left-auto md:w-1/2"
			/>
		</div>
	);
}
