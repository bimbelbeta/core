import { ROLES } from "@bimbelbeta/contract/common/roles";
import {
	ArchiveIcon,
	BooksIcon,
	FileTextIcon,
	HouseIcon,
	PackageIcon,
	RankingIcon,
	TicketIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { NavFooter } from "./nav-footer";
import { NavMain } from "./nav-main";

const NAV_GROUPS = ["", "Konten", "Manajemen"] as const;

const allAdminNavLinks = [
	{
		title: "Dashboard",
		url: "/admin/dashboard",
		icon: HouseIcon,
		group: "",
	},
	{
		title: "Tryout",
		url: "/admin/tryouts",
		icon: FileTextIcon,
		group: "Konten",
	},
	{
		title: "Bank soal",
		url: "/admin/questions",
		icon: ArchiveIcon,
		group: "Konten",
	},
	{
		title: "Kelas",
		url: "/admin/classes",
		icon: BooksIcon,
		group: "Konten",
	},
	{
		title: "Passing grade",
		url: "/admin/passing-grades",
		icon: RankingIcon,
		group: "Manajemen",
	},
	{
		title: "Pengguna",
		url: "/admin/users",
		icon: UserIcon,
		group: "Manajemen",
		superadminOnly: true,
	},
	{
		title: "Produk",
		url: "/admin/products",
		icon: PackageIcon,
		group: "Manajemen",
		superadminOnly: true,
	},
	{
		title: "Kode referral",
		url: "/admin/referrals",
		icon: TicketIcon,
		group: "Manajemen",
		superadminOnly: true,
	},
].map((link) => ({ superadminOnly: false, ...link }));

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const location = useLocation();
	const { session } = useRouteContext({ from: "/admin" });

	const navGroups = NAV_GROUPS.map((label) => ({
		label,
		items: allAdminNavLinks
			.filter((link) => link.group === label)
			.filter((link) => !link.superadminOnly || session?.user?.role === ROLES.SUPER_ADMIN)
			.map((link) => ({
				title: link.title,
				url: link.url,
				icon: link.icon,
				isActive: location.pathname.startsWith(link.url),
			})),
	})).filter((group) => group.items.length > 0);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="h-14 justify-center border-b py-0 pr-3 pl-[1.375rem]">
				<Link to="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
					<div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
						<span className="truncate font-sans text-[0.8125rem] font-semibold tracking-tight">bimbelbeta</span>
						<span className="text-muted-foreground text-meta truncate">Konsol admin</span>
					</div>
				</Link>
			</SidebarHeader>
			<SidebarContent className="gap-0.5 pt-2">
				<NavMain groups={navGroups} />
			</SidebarContent>
			<NavFooter />
			<SidebarRail />
		</Sidebar>
	);
}
