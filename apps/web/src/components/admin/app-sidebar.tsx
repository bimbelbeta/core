"use client";

import {
	ArchiveIcon,
	BooksIcon,
	FileTextIcon,
	HouseIcon,
	PackageIcon,
	RankingIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar";
import { NavFooter } from "./nav-footer";
import { NavMain } from "./nav-main";

const allAdminNavLinks = [
	{
		title: "Dashboard",
		url: "/admin/dashboard",
		icon: HouseIcon,
	},
	{
		title: "Tryouts",
		url: "/admin/tryouts",
		icon: FileTextIcon,
	},
	{
		title: "Questions",
		url: "/admin/questions",
		icon: ArchiveIcon,
	},
	{
		title: "Classes",
		url: "/admin/classes",
		icon: BooksIcon,
	},
	{
		title: "Passing Grade",
		url: "/admin/passing-grades",
		icon: RankingIcon,
	},
	{
		title: "Users",
		url: "/admin/users",
		icon: UserIcon,
		superadminOnly: true,
	},
	{
		title: "Products",
		url: "/admin/products",
		icon: PackageIcon,
		superadminOnly: true,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const location = useLocation();
	const { session } = useRouteContext({ from: "/admin" });
	const { setOpenMobile } = useSidebar();

	const adminNavLinks = allAdminNavLinks.filter((link) => !link.superadminOnly || session?.user?.role === "superadmin");

	const navLinksWithActive = adminNavLinks.map((link) => ({
		...link,
		isActive: location.pathname.startsWith(link.url),
	}));

	return (
		<Sidebar collapsible="icon" {...props}>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: event delegation to close mobile sidebar on any link click */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: event delegation to close mobile sidebar on any link click */}
			<div
				className="contents"
				onClick={(e) => {
					if ((e.target as HTMLElement).closest("a")) setOpenMobile(false);
				}}
			>
				<SidebarHeader>
					<Link to="/admin/dashboard" className="flex items-center gap-2 px-2 py-1.5">
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold text-sm">BimbelBeta Admin</span>
						</div>
					</Link>
				</SidebarHeader>
				<SidebarContent>
					<NavMain items={navLinksWithActive} />
				</SidebarContent>
				<NavFooter />
				<SidebarRail />
			</div>
		</Sidebar>
	);
}
