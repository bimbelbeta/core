import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/header";
import { createMeta } from "@/lib/seo-utils";
import { FAQ } from "./-home/faq";
import { Features } from "./-home/features";
import Footer from "./-home/footer";
import { Hero } from "./-home/hero";
import { Pricing } from "./-home/pricing";
import { Statement } from "./-home/statement";
import Testimone from "./-home/testimone";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: createMeta({
			description:
				"Ubah persiapan ujian SNBT/UTBK menjadi lebih mudah dan terstruktur dengan bimbelbeta. Materi lengkap, latihan soal interaktif, dan analisis progres belajar.",
			image: "/og-image.png",
		}),
	}),
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<>
			<Header />
			<Hero />
			<Statement />
			<Features />
			<Testimone />
			<Pricing />
			<FAQ />
			<Footer />
		</>
	);
}
