import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Button } from "@/components/ui/button";

interface DashboardMainCardProps {
	title: string;
	description: string;
	to?: string;
	href?: string;
	src?: string;
}

export function DashboardMainCard({ title, description, to, href, src }: DashboardMainCardProps) {
	return (
		<div className="h-full space-y-6 overflow-visible rounded-sm border border-neutral-200 bg-white p-4">
			<div className="relative flex h-21.5 w-full justify-end overflow-visible rounded-sm bg-secondary-100 p-1.5">
				<Image
					src={src as string}
					width={150}
					alt=""
					height={150}
					className="absolute bottom-0 left-0 h-[150%] w-auto select-none"
				/>

				<Button asChild size="icon">
					{to ? (
						<Link to={to}>
							<ArrowRightIcon weight="bold" />
						</Link>
					) : (
						<a href={href} target="_blank" rel="noopener noreferrer">
							<ArrowRightIcon weight="bold" />
						</a>
					)}
				</Button>
			</div>

			<div className="space-y-1 text-secondary-800">
				<h2 className="font-semibold text-2xl leading-tight">{title}</h2>
				<p className="font-normal text-base leading-normal">{description}</p>
			</div>
		</div>
	);
}
