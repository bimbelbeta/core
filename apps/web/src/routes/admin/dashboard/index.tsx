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

export const Route = createFileRoute("/admin/dashboard/")({
	component: function AdminDashboard() {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<AdminPageTitle>Dashboard</AdminPageTitle>
						<p className="text-muted-foreground text-sm">Ikhtisar performa dan aktivitas sistem</p>
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
