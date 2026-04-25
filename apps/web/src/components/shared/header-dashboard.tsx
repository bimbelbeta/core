import { ListIcon, SignOutIcon, XIcon } from "@phosphor-icons/react";
import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useState } from "react";
import { LogoutDialog } from "@/components/shared/logout-dialog";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
		<header
			className={`fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-colors ${mobileMenuOpen ? "bg-white" : "bg-transparent"}`}
		>
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
			<AnimatePresence>
				{mobileMenuOpen && (
					<div className="fixed inset-0 z-50 md:hidden">
						<m.div
							className="absolute inset-0 bg-black/50"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							onClick={() => setMobileMenuOpen(false)}
						/>
						<m.div
							className="absolute inset-x-0 top-0 flex min-h-screen w-full flex-col bg-white p-6 shadow-2xl"
							initial={{ y: "-100%" }}
							animate={{ y: 0 }}
							exit={{ y: "-100%" }}
							transition={{ type: "spring", damping: 30, stiffness: 300 }}
						>
							<div className="flex items-center justify-between">
								<Link to="/" className="font-bold text-2xl leading-none" onClick={() => setMobileMenuOpen(false)}>
									<span className="text-secondary-900">Bimbel</span>
									<span className="text-tertiary-1000">Beta</span>
								</Link>
								<Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
									<XIcon className="size-6" />
								</Button>
							</div>

							<m.div
								className="mt-8 flex flex-col gap-4"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1, duration: 0.3 }}
							>
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
							</m.div>

							<div className="mt-auto border-neutral-200 border-t pt-6">
								<div className="mb-4 flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-default bg-secondary-600 font-normal text-sm text-white">
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
						</m.div>
					</div>
				)}
			</AnimatePresence>

			<LogoutDialog open={open} onOpenChange={setOpen} />
		</header>
	);
}
