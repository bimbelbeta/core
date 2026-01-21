"use client";

import { BooksIcon, HouseIcon } from "@phosphor-icons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavFooter } from "./nav-footer";
import { NavMain } from "./nav-main";

const adminNavLinks = [
	{
		title: "Dashboard",
		url: "/admin/dashboard/",
		icon: HouseIcon,
	},
	{
		title: "Classes",
		url: "/admin/classes",
		icon: BooksIcon,
	},
	{
		title: "Passing Grade",
		url: "/admin/passing-grades",
		icon: BooksIcon,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const location = useLocation();

	const navLinksWithActive = adminNavLinks.map((link) => ({
		...link,
		isActive: location.pathname.startsWith(link.url),
	}));

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<Link to="/admin/dashboard" className="flex items-center gap-2 px-2 py-1.5">
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold text-sm">bimbelbeta Admin</span>
					</div>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navLinksWithActive} />
			</SidebarContent>
			<NavFooter />
			<SidebarRail />
		</Sidebar>
	);
}
