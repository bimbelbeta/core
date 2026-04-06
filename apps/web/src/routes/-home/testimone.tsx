// import Carousel from "@/components/shared/carousel";
import { Container } from "@/components/ui/container";
import { Heading } from "./-components/heading";
import { DATA } from "./data";
import { Image } from "@unpic/react";

export default function Testimone() {
	return (
		<Container className="max-w-7xl overflow-x-clip">
			<div className="mb-4 text-center">
				<Heading>
					Hasil Nyata dari Strategi Belajar <span className="font-semibold text-secondary-700">Bimbel Beta</span>
				</Heading>
			</div>

			<div className="mx-auto mt-3 mb-5 grid w-fit grid-cols-1 gap-x-12 gap-y-4 sm:mt-5 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3 xl:mt-10 xl:gap-x-30">
				{DATA.stats.map((stat) => (
					<div key={stat.id} className="flex flex-col items-center sm:last:col-span-2 lg:last:col-span-1">
						<p className="text-center font-semibold text-2xl text-secondary-700 leading-9 sm:text-4xl md:leading-11.5 2xl:text-5xl">
							{stat.value}
						</p>
						<p className="mt-3 max-w-50 text-center text-sm leading-5.25 md:text-sm lg:text-base">{stat.desc}</p>
					</div>
				))}
			</div>

			{/*<Carousel
				items={[...DATA.testimone]}
				showNavigation={true}
				showDots={true}
				autoPlay={false}
				gap={35}
				responsiveGap={true}
				className=""
			/>*/}
			<TestimoneCard data={DATA.testimone} />
		</Container>
	);
}

function TestimoneCard({ data }: { data: typeof DATA.testimone }) {
	const placeholder = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400";

	return (
		<div className="grid gap-6 sm:grid-cols-2">
			{data.map((t) => (
				<div key={t.id} className="flex flex-col md:flex-row items-start gap-4 p-4 bg-white border border-0.5 rounded-lg md:h-60">
					<Image
						src={t.avatar ?? placeholder}
            alt={`${t.name} avatar`}
						width={1000}
            height={1000}
						className="md:w-40 h-60 md:h-full rounded-lg object-top object-cover aspect-3/4"
					/>

					<div className="h-full flex flex-col justify-between">
						<div className="mb-3 pr-2 overflow-y-scroll max-h-30 lg:max-h-40">
							<p className="text-gray-500 text-sm">{t.desc}</p>
						</div>

						<div className="mb-0 mt-auto">
							<p className="text-base md:text-lg font-medium">{t.name}</p>
							<p className="text-xs md:text-sm text-gray-400">{t.title}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
