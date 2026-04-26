import { Link, useMatches } from "@tanstack/react-router";
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
		.map((match) => ({
			label: match.staticData.breadcrumb!,
			to: match.pathname,
		}));

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<BreadcrumbItem key={item.to}>
							{isLast ? (
								<BreadcrumbPage>{item.label}</BreadcrumbPage>
							) : (
								<>
									<BreadcrumbLink asChild>
										<Link to={item.to}>{item.label}</Link>
									</BreadcrumbLink>
									<BreadcrumbSeparator />
								</>
							)}
						</BreadcrumbItem>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
