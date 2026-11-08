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
	const allParams: Record<string, string> = {};
	for (const match of matches) {
		Object.assign(allParams, match.params);
	}
	const resolve = (value: string) => value.replace(/\$(\w+)/g, (_, key) => allParams[key] ?? value);

	const items = matches
		.filter((match) => match.staticData?.breadcrumb)
		.flatMap((match) => {
			const staticData = match.staticData;
			const leaf = { label: resolve(staticData.breadcrumb!), to: resolve(match.pathname) };
			const parents = [
				...(staticData.breadcrumbParents ?? []),
				...(staticData.breadcrumbParent ? [staticData.breadcrumbParent] : []),
			];
			return [...parents.map((parent) => ({ label: resolve(parent.label), to: resolve(parent.to) })), leaf];
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
