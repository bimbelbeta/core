import Carousel from "@/components/carousel";
import { Body } from "./-componenets/body";
import { Heading } from "./-componenets/heading";
import { DATA } from "./data";

export default function Testimone() {
	return (
		<section className="overflow-x-clip">
			<div className="mb-4 text-center">
				<Heading>
					Hasil Nyata dari Strategi Belajar <span className="font-semibold text-secondary-700">Bimbel Beta</span>
				</Heading>
			</div>

			<div className="mx-auto mt-3 mb-10 grid w-fit grid-cols-1 gap-x-12 sm:grid-cols-2 lg:mt-6 lg:mb-17 lg:grid-cols-3">
				{DATA.stats.map((stat) => (
					<div key={stat.id} className="flex flex-col items-center sm:last:col-span-2 lg:last:col-span-1">
						<p className="text-center font-semibold text-2xl text-secondary-700 leading-9 md:text-4xl md:leading-11.5 2xl:text-4xl">
							{stat.value}
						</p>
						<Body className="max-w-50">{stat.desc}</Body>
					</div>
				))}
			</div>

			<Carousel
				items={[...DATA.testimone]}
				showNavigation={true}
				showDots={true}
				autoPlay={false}
				gap={5}
				responsiveGap={true}
				className=""
			/>
		</section>
	);
}
