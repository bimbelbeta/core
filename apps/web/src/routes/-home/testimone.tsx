// import Carousel from "@/components/shared/carousel";

import { Image } from "@unpic/react";
import { Container } from "@/components/ui/container";
import { Heading } from "./-components/heading";
import { DATA } from "./data";

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
				<div
					key={t.id}
					className="flex flex-col items-start gap-4 rounded-lg border border-0.5 bg-white p-4 md:h-60 md:flex-row"
				>
					<Image
						src={t.avatar ?? placeholder}
						alt={`${t.name} avatar`}
						width={1000}
						height={1000}
						className="aspect-3/4 h-60 rounded-lg object-cover object-top md:h-full md:w-40"
					/>

					<div className="flex h-full flex-col justify-between">
						<div className="mb-3 max-h-30 overflow-y-scroll pr-2 lg:max-h-40">
							<p className="text-gray-500 text-sm">{t.desc}</p>
						</div>

						<div className="mt-auto mb-0">
							<p className="font-medium text-base md:text-lg">{t.name}</p>
							<p className="text-gray-400 text-xs md:text-sm">{t.title}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
