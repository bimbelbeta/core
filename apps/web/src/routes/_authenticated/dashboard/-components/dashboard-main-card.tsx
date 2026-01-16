import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface DashboardMainCardProps {
	title: string;
	description: string;
	to?: string;
	href?: string;
}

export function DashboardMainCard({ title, description, to, href }: DashboardMainCardProps) {
	return (
		<div className="h-52 space-y-2 overflow-hidden rounded-sm border border-neutral-200 bg-white p-6">
			<div className="flex h-21.5 w-full justify-end rounded-sm bg-secondary-100 p-1.5">
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

			<div className="text-secondary-800">
				<h2 className="font-bold text-2xl leading-tight sm:text-[29px]">{title}</h2>
				<p className="mt-1 font-normal text-base leading-normal">{description}</p>
			</div>
		</div>
	);
}
