import { Container } from "@/components/ui/container";
import { Body } from "./-componenets/body";
import { Heading } from "./-componenets/heading";

export function Statement() {
	return (
		<Container className="max-w-3xl">
			<Heading>
				<span className="font-semibold text-secondary-700">Masalah terbesarmu</span> bukan kurang pintar,
				{/*<br className="hidden sm:block" />*/}
				tapi <span className="font-semibold text-secondary-700">caramu belajar yang terpecah-pecah.</span>
			</Heading>
			<Body>
				Materi dan soalmu berceceran di banyak tempat dan waktumu
				<br className="hidden md:block" />
				habis buat mengatur teknis, progress malah jalan di tempat.
			</Body>
		</Container>
	);
}
