import { UserFocusIcon } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@tanstack/react-router";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon: React.ComponentType<{ weight?: "fill" | "regular"; className?: string }>;
		isActive?: boolean;
	}[];
}) {
	const { setOpenMobile } = useSidebar();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Menu</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
							<Link to={item.url} onClick={() => setOpenMobile(false)}>
								<item.icon weight={item.isActive ? "fill" : "regular"} />
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
			<SidebarGroupLabel>Other</SidebarGroupLabel>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton asChild tooltip="Dashboard User">
						<Link to="/dashboard" onClick={() => setOpenMobile(false)}>
							<UserFocusIcon weight="regular" />
							<span>User Dashboard</span>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
