import { Link } from "@tanstack/react-router";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Typography } from "@/components/ui/typography";

type NavItem = {
	title: string;
	url: string;
	icon: React.ComponentType<{ weight?: "fill" | "regular"; className?: string }>;
	isActive?: boolean;
};

export function NavMain({ groups }: { groups: { label: string; items: NavItem[] }[] }) {
	return (
		<>
			{groups.map((group) => (
				<SidebarGroup key={group.label} className="px-3 py-1">
					{group.label && (
						<SidebarGroupLabel asChild className="text-muted-foreground h-6 px-2.5">
							<Typography className="text-xs font-medium">{group.label}</Typography>
						</SidebarGroupLabel>
					)}
					<SidebarMenu className="gap-0.5">
						{group.items.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									isActive={item.isActive}
									tooltip={item.title}
									className="text-muted-foreground hover:text-foreground data-[active=true]:bg-primary/8 data-[active=true]:text-primary text-meta h-9 gap-2.5 rounded-md px-2.5 font-normal transition-colors data-[active=true]:font-semibold"
								>
									<Link to={item.url}>
										<item.icon weight={item.isActive ? "fill" : "regular"} className="size-4" />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			))}
		</>
	);
}
