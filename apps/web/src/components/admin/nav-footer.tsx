import { SignOutIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export function NavFooter() {
	const { session } = useRouteContext({ from: "/admin" });
	const [pending, setPending] = useState(false);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

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
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<SidebarMenuButton
								tooltip="Keluar"
								className="text-destructive hover:bg-destructive/10 hover:text-destructive"
							>
								<SignOutIcon weight="bold" />
								<span>Keluar</span>
							</SidebarMenuButton>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Apakah anda yakin ingin keluar?</AlertDialogTitle>
								<AlertDialogDescription>Kamu akan dikeluarkan dan harus login kembali.</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Kembali</AlertDialogCancel>
								<Button
									onClick={async () => {
										setPending(true);
										await authClient.signOut();
										queryClient.removeQueries();
										navigate({ to: "/" });
										setPending(false);
									}}
									disabled={pending}
									variant={"destructive"}
								>
									{pending ? (
										<>
											<SpinnerIcon className="animate-spin" />
											Memasak...
										</>
									) : (
										<>
											<SignOutIcon weight="bold" /> Keluar
										</>
									)}
								</Button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarFooter>
	);
}
