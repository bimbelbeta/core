"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

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

function _LogoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Apakah anda yakin ingin keluar?</AlertDialogTitle>
					<AlertDialogDescription>Anda akan logout dari panel admin.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Kembali</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button
							onClick={async () => {
								await authClient.signOut();
								queryClient.removeQueries();
								navigate({ to: "/login" });
							}}
							variant="destructive"
						>
							<SignOutIcon /> Keluar
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
