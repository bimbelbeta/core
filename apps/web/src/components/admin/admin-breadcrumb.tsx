import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AdminBreadcrumb() {
	const matches = useMatches();

	const items = matches
		.filter((match) => match.staticData?.breadcrumb)
		.flatMap((match) => {
			const leaf = { label: match.staticData.breadcrumb!, to: match.pathname };
			const parent = match.staticData.breadcrumbParent;
			return parent ? [parent, leaf] : [leaf];
		});

	if (items.length === 0) return null;

	return (
		<Breadcrumb>
			<BreadcrumbList className="gap-1.5 text-xs sm:gap-1.5">
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<Fragment key={item.to}>
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage className="text-foreground font-medium">{item.label}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link to={item.to}>{item.label}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator className="text-muted-foreground/50 [&>svg]:size-3" />}
						</Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
