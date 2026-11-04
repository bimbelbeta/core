import { createFileRoute } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
import { QuickLinks } from "@/components/admin/quick-links";
import { SectionCards } from "@/components/admin/section-cards";
import { Typography } from "@/components/ui/typography";

export const Route = createFileRoute("/admin/dashboard/")({
	staticData: { breadcrumb: "Dashboard" },
	component: function AdminDashboard() {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<AdminPageTitle>Dashboard</AdminPageTitle>
						<Typography tone="muted">Ikhtisar performa dan aktivitas sistem</Typography>
					</AdminPageHeaderContent>
				</AdminPageHeader>

				<AdminPageContent>
					<div className="flex flex-col gap-4">
						<SectionCards />
						<QuickLinks />
					</div>
				</AdminPageContent>
			</AdminPageRoot>
		);
	},
});
