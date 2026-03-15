import { SignOutIcon } from "@phosphor-icons/react";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { LogoutDialog } from "@/components/shared/logout-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavFooter() {
	const { session } = useRouteContext({ from: "/admin" });
	const [open, setOpen] = useState(false);

	const userInitials = session?.user?.name
		? session.user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "AD";

	return (
		<SidebarFooter>
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
				<SidebarMenuItem>
					<SidebarMenuButton
						tooltip="Keluar"
						className="text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={() => setOpen(true)}
					>
						<SignOutIcon weight="bold" />
						<span>Keluar</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
			<LogoutDialog open={open} onOpenChange={setOpen} />
		</SidebarFooter>
	);
}
