import { Container } from "@/components/ui/container";
import { Heading } from "./-componenets/heading";
import { Body } from "./-componenets/body";

export function Statement() {
	return (
		<Container>
			<Heading>
				<span className="font-semibold text-secondary-700">Masalah terbesarmu</span> bukan kurang pintar,<br className="hidden md:block" />tapi <span className="font-semibold text-secondary-700">caramu belajar yang terpecah-pecah.</span>
      </Heading>
      <Body>
        Materi dan soalmu berceceran di banyak tempat dan waktumu<br className="hidden md:block" /> habis buat mengatur teknis, progress malah jalan di tempat.
			</Body>
		</Container>
	);
}
