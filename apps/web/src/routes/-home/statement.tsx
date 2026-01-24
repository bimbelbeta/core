import { Container } from "@/components/ui/container";
import { Body } from "./-componenets/body";
import { Heading } from "./-componenets/heading";

export function Statement() {
	return (
		<section className="bg-background py-20 xl:py-35">
			<Container className="max-w-3xl py-0 xl:max-w-5xl">
				<Heading>
					<span className="font-semibold text-secondary-700">Masalah terbesarmu</span> bukan kurang pintar,
					<br className="hidden xl:block" />
					tapi <span className="font-semibold text-secondary-700">caramu belajar yang terpecah-pecah.</span>
				</Heading>
				<Body>
					Materi dan soalmu berceceran di banyak tempat dan waktumu
					<br className="hidden md:block" />
					habis buat mengatur teknis, progress malah jalan di tempat.
				</Body>
			</Container>
		</section>
	);
}
