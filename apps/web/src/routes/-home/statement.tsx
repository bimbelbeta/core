import { Container } from "@/components/ui/container";
import { Typography } from "@/components/ui/typography";

export function Statement() {
	return (
		<section className="bg-background py-20 xl:py-35">
			<Container className="max-w-3xl py-0 xl:max-w-5xl">
				<Typography variant="display" as="h2" className="text-center">
					<span className="text-secondary-700 font-semibold">Masalah terbesarmu</span> bukan kurang pintar,
					<br className="hidden xl:block" />
					tapi <span className="text-secondary-700 font-semibold">caramu belajar yang terpecah-pecah.</span>
				</Typography>
				<Typography variant="body" className="text-center">
					Materi dan soalmu berceceran di banyak tempat dan waktumu
					<br className="hidden md:block" />
					habis buat mengatur teknis, progress malah jalan di tempat.
				</Typography>
			</Container>
		</section>
	);
}
