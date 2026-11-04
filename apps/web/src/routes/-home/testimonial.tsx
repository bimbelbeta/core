import { Image } from "@unpic/react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Typography } from "@/components/ui/typography";
import { HOME_PAGE_CONTENT } from "./data";

export default function Testimonial() {
	return (
		<Container className="max-w-7xl overflow-x-clip">
			<div className="mb-4 text-center">
				<Typography variant="display" as="h2">
					Hasil Nyata dari Strategi Belajar <span className="text-secondary-700 font-semibold">Bimbel Beta</span>
				</Typography>
			</div>

			<div className="mx-auto mt-3 mb-5 grid w-fit grid-cols-1 gap-x-12 gap-y-4 sm:mt-5 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3 xl:mt-10 xl:gap-x-30">
				{HOME_PAGE_CONTENT.stats.map((stat) => (
					<div key={stat.id} className="flex flex-col items-center sm:last:col-span-2 lg:last:col-span-1">
						<Typography variant="display" as="p" className="text-secondary-700 text-center">
							{stat.value}
						</Typography>
						<Typography variant="body" className="mt-3 max-w-50 text-center">
							{stat.desc}
						</Typography>
					</div>
				))}
			</div>

			<TestimonialCard data={HOME_PAGE_CONTENT.testimonials} />
		</Container>
	);
}

function TestimonialCard({ data }: { data: typeof HOME_PAGE_CONTENT.testimonials }) {
	const placeholder = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400";

	return (
		<div className="grid gap-6 sm:grid-cols-2">
			{data.map((t) => (
				<Card key={t.id} variant="flush" className="border-0.5 items-start gap-4 p-4 md:h-60 md:flex-row">
					<Image
						src={t.avatar ?? placeholder}
						alt={`${t.name} avatar`}
						width={1000}
						height={1000}
						className="aspect-3/4 h-60 rounded-lg object-cover object-top md:h-full md:w-40"
					/>

					<div className="flex h-full flex-col justify-between">
						<div className="mb-3 max-h-30 overflow-y-scroll pr-2 lg:max-h-40">
							<Typography variant="body" tone="muted">
								{t.desc}
							</Typography>
						</div>

						<div className="mt-auto mb-0">
							<Typography variant="subtitle2" as="p">
								{t.name}
							</Typography>
							<Typography variant="caption">{t.title}</Typography>
						</div>
					</div>
				</Card>
			))}
		</div>
	);
}
