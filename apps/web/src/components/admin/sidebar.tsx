import { BooksIcon, House, List, SignOut, UserSwitchIcon, X } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const adminNavLinks = [
	{
		name: "Dashboard",
		to: "/admin/dashboard" as const,
		icon: House,
	},
	{
		name: "Classes",
		to: "/admin/classes" as const,
		icon: BooksIcon,
	},
];

export function AdminSidebar() {
	const location = useLocation();
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<>
			{/* Mobile Menu Button */}
			<div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
				<a href="/admin/dashboard" className="font-bold text-lg text-primary">
					bimbelbeta Admin
				</a>
				<Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
					{mobileMenuOpen ? <X className="size-6" /> : <List className="size-6" />}
				</Button>
			</div>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<button
					type="button"
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setMobileMenuOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setMobileMenuOpen(false);
					}}
					aria-label="Close menu"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar transition-transform duration-300 lg:translate-x-0",
					mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex h-16 items-center border-b px-6">
					<a href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
						bimbelbeta Admin
					</a>
				</div>

				<nav className="flex flex-1 flex-col gap-1 p-4">
					<div className="mb-2 px-2 text-muted-foreground text-xs uppercase tracking-wider">Menu</div>
					{adminNavLinks.map((link) => {
						const isActive = location.pathname.startsWith(link.to);
						const Icon = link.icon;

						return (
							<Button
								key={link.to}
								variant="ghost"
								size="default"
								className={cn(
									"justify-start gap-3 rounded-lg font-medium transition-all",
									isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground hover:bg-muted",
								)}
								onClick={() => setMobileMenuOpen(false)}
								asChild
							>
								<a href={link.to}>
									<Icon className="size-5" weight={isActive ? "fill" : "regular"} />
									{link.name}
								</a>
							</Button>
						);
					})}

					<div className="mt-6 mb-2 px-2 text-muted-foreground text-xs uppercase tracking-wider">Other</div>
					<Button
						variant="ghost"
						size="default"
						onClick={() => setMobileMenuOpen(false)}
						asChild
						className="justify-start gap-3 text-muted-foreground hover:bg-muted"
					>
						<a href="/dashboard">
							<UserSwitchIcon className="size-5" />
							User Dashboard
						</a>
					</Button>
				</nav>

				<div className="border-t p-4">
					<Button
						variant="ghost"
						className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
						onClick={() => {
							setMobileMenuOpen(false);
							setLogoutDialogOpen(true);
						}}
					>
						<SignOut className="size-5" />
						Logout
					</Button>
				</div>
			</aside>

			<LogoutDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
		</>
	);
}

function LogoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
							<SignOut /> Keluar
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
