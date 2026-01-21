"use client";

import { useRouteContext } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavFooter() {
	const { session } = useRouteContext({ from: "/admin" });

	const userInitials = session?.user?.name
		? session.user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "AD";

	return (
		<SidebarGroup>
			<SidebarMenu>
				<SidebarMenuItem>
					<div className="flex items-center gap-3 px-2 py-1.5">
						<Avatar className="h-8 w-8 rounded-lg">
							{session?.user?.image && <AvatarImage src={session?.user.image} alt={session?.user.name || "Admin"} />}
							<AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{session?.user?.name || "Admin User"}</span>
							<span className="truncate text-muted-foreground text-xs">{session?.user?.email || ""}</span>
						</div>
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
