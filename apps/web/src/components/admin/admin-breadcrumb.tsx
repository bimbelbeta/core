import { Link, useLocation } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function formatSegment(segment: string): string {
	// Check if it's a dynamic param (numeric)
	if (/^\d+$/.test(segment)) {
		return `#${segment}`;
	}

	// Check if it's a UUID (rough check)
	if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
		return "Detail";
	}

	// Capitalize and replace dashes with spaces
	return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function AdminBreadcrumb() {
	const location = useLocation();
	const pathname = location.pathname;

	// Parse route segments, skip empty and "admin"
	const segments = pathname.split("/").filter((segment) => segment && segment !== "admin");

	// Build breadcrumb items
	const breadcrumbItems = segments.map((segment, index) => {
		const path = `/admin/${segments.slice(0, index + 1).join("/")}`;
		const isLast = index === segments.length - 1;
		const title = formatSegment(segment);

		return {
			path,
			title,
			isLast,
		};
	});

	if (breadcrumbItems.length === 0) {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Admin</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link to="/admin/dashboard">Admin</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				{breadcrumbItems.map((item, index) => (
					<BreadcrumbItem key={item.path}>
						{item.isLast ? (
							<BreadcrumbPage>{item.title}</BreadcrumbPage>
						) : (
							<>
								<BreadcrumbLink asChild>
									<Link to={item.path}>{item.title}</Link>
								</BreadcrumbLink>
								{index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
							</>
						)}
					</BreadcrumbItem>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
