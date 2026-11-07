import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

interface DashboardMainCardProps {
	title: string;
	description: string;
	to?: string;
	href?: string;
	src: string;
}

export function DashboardMainCard({ title, description, to, href, src }: DashboardMainCardProps) {
	return (
		<Card
			variant="unpadded"
			className="h-full space-y-6 overflow-visible rounded-sm border-neutral-200 p-4 shadow-none"
		>
			<div className="bg-secondary-100 relative flex h-21.5 w-full justify-end overflow-visible rounded-sm p-1.5">
				<Image
					src={src}
					width={150}
					alt=""
					height={150}
					className="absolute bottom-0 left-0 h-[150%] w-auto select-none"
				/>

				<Button asChild size="icon">
					{to ? (
						<Link to={to} aria-label={`Selengkapnya: ${title}`}>
							<ArrowRightIcon weight="bold" />
						</Link>
					) : (
						<a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Selengkapnya: ${title}`}>
							<ArrowRightIcon weight="bold" />
						</a>
					)}
				</Button>
			</div>

			<div className="text-secondary-800 space-y-1">
				<Typography variant="subtitle1" className="text-secondary-800">
					{title}
				</Typography>
				<Typography variant="subtitle3">{description}</Typography>
			</div>
		</Card>
	);
}
