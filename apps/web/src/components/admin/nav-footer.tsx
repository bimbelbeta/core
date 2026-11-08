import { ROLES } from "@bimbelbeta/contract/common/roles";
import { DotsThreeIcon, SignOutIcon } from "@phosphor-icons/react";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { LogoutDialog } from "@/components/shared/logout-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarFooter } from "@/components/ui/sidebar";

const ROLE_LABELS = {
	[ROLES.SUPER_ADMIN]: "Superadmin",
	[ROLES.ADMIN]: "Administrator",
	user: "Pengguna",
};

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

	const roleLabel = session?.user?.role
		? (ROLE_LABELS[session.user.role as keyof typeof ROLE_LABELS] ?? "Pengguna")
		: "Pengguna";

	return (
		<SidebarFooter className="border-t p-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="none"
						className="h-auto w-full gap-2.5 px-2.5 py-2 text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
					>
						<Avatar className="size-7 shrink-0">
							{session?.user?.image && <AvatarImage src={session.user.image} alt={session.user.name || "Admin"} />}
							<AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
						</Avatar>
						<div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
							<span className="text-meta truncate font-medium">{session?.user?.name || "Admin User"}</span>
							<span className="text-muted-foreground text-meta">{roleLabel}</span>
						</div>
						<span className="flex size-7 shrink-0 items-center justify-center group-data-[collapsible=icon]:hidden">
							<DotsThreeIcon className="text-muted-foreground size-4.5" />
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="top" align="start" className="w-64">
					<DropdownMenuLabel className="font-normal">
						<p className="text-meta font-medium">{session?.user?.name || "Admin User"}</p>
						<p className="text-muted-foreground text-meta mt-0.5 break-all">{session?.user?.email || ""}</p>
						<p className="text-muted-foreground text-meta mt-1">{roleLabel}</p>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setOpen(true)}>
						<SignOutIcon className="size-4" />
						Keluar
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<LogoutDialog open={open} onOpenChange={setOpen} />
		</SidebarFooter>
	);
}
