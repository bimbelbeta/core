import { ListIcon, SignOutIcon, SpinnerIcon, XIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const links = [
	{
		name: "Dashboard",
		to: "/dashboard",
		external: false,
	},
	{
		name: "Kelas",
		to: "/classes",
		external: false,
	},
	{
		name: "Tryout",
		to: "/tryout",
		external: false,
	},
	{
		name: "Premium",
		to: "/premium",
		external: false,
	},
] as const;

export function HeaderDashboard() {
	const location = useLocation();
	const { session } = useRouteContext({ from: "/_authenticated" });
	const [open, setOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const userInitials = session?.user.name
		? session.user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.substring(0, 2)
				.toUpperCase()
		: "U";

	return (
		<header className="fixed inset-x-0 top-0 z-50 bg-transparent backdrop-blur-md">
			<div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-8">
				<Link to="/" className="font-bold leading-none">
					<span className="text-secondary-900">Bimbel</span>
					<span className="text-tertiary-1000">Beta</span>
				</Link>

				<div className="flex items-center gap-6">
					{/* Desktop Navigation */}
					<div className="hidden h-full items-center gap-2 md:flex">
						{links.map((link) => {
							const isActive = !link.external && location.pathname.startsWith(link.to);
							if (link.external) {
								return (
									<Button key={link.to} size="xl" variant="ghost" asChild>
										<a href={link.to} target="_blank" rel="noopener noreferrer">
											{link.name}
										</a>
									</Button>
								);
							}

							return (
								<Button key={link.to} size="xl" variant={isActive ? "default" : "ghost"} asChild>
									<Link to={link.to}>{link.name}</Link>
								</Button>
							);
						})}
					</div>

					{/* Desktop User Profile */}
					<div className="hidden md:flex md:items-center md:gap-4">
						<DropdownMenu>
							<DropdownMenuTrigger className="outline-none">
								<div className="flex size-10 items-center justify-center rounded-default bg-secondary-600 font-normal text-sm text-white transition-transform hover:scale-105 active:scale-95">
									{userInitials}
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>{session?.user.name}</DropdownMenuLabel>
								<DropdownMenuItem variant="destructive" onSelect={() => setOpen(true)}>
									<SignOutIcon className="mr-2 size-4" />
									Log Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Mobile Menu Button */}
					<Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
						<ListIcon className="size-6" />
					</Button>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-50 flex flex-col bg-white p-6 shadow-lg md:hidden">
					<div className="flex items-center justify-between">
						<Link to="/" className="font-bold text-2xl leading-none" onClick={() => setMobileMenuOpen(false)}>
							<span className="text-secondary-900">Bimbel</span>
							<span className="text-tertiary-1000">Beta</span>
						</Link>
						<Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
							<XIcon className="size-6" />
						</Button>
					</div>

					<div className="mt-8 flex flex-col gap-4">
						{links.map((link) => {
							const isActive = !link.external && location.pathname.startsWith(link.to);

							if (link.external) {
								return (
									<a
										key={link.to}
										href={link.to}
										target="_blank"
										rel="noopener noreferrer"
										className="rounded-md px-4 py-3 font-medium text-lg text-secondary-900 hover:bg-accent"
										onClick={() => setMobileMenuOpen(false)}
									>
										{link.name}
									</a>
								);
							}

							return (
								<Link
									key={link.to}
									to={link.to}
									className={`rounded-md px-4 py-3 text-lg hover:bg-accent ${
										isActive ? "bg-secondary-100/50 font-bold text-secondary-700" : "font-medium text-secondary-900"
									}`}
									onClick={() => setMobileMenuOpen(false)}
								>
									{link.name}
								</Link>
							);
						})}
					</div>

					<div className="mt-auto border-neutral-200 border-t pt-6">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-[10px] bg-secondary-600 font-normal text-sm text-white">
								{userInitials}
							</div>
							<span className="font-medium">{session?.user.name}</span>
						</div>
						<Button
							variant="destructive"
							className="w-full justify-start"
							onClick={() => {
								setMobileMenuOpen(false);
								setOpen(true);
							}}
						>
							<SignOutIcon className="mr-2 size-4" />
							Log Out
						</Button>
					</div>
				</div>
			)}

			<LogoutDialog open={open} onOpenChange={setOpen} />
		</header>
	);
}

const LogoutDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
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
	);
};
