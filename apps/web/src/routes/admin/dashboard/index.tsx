import { createFileRoute } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { RecentQuestions } from "@/components/admin/recent-questions";
import { RecentTryouts } from "@/components/admin/recent-tryouts";
import { SectionCards } from "@/components/admin/section-cards";
import { Typography } from "@/components/ui/typography";

export const Route = createFileRoute("/admin/dashboard/")({
	staticData: { breadcrumb: "Dashboard" },
	component: function AdminDashboard() {
		return (
			<AdminPageRoot>
				<AdminPageHeader className="sm:items-start">
					<AdminPageHeaderContent>
						<Typography variant="title">Dashboard</Typography>
						<Typography variant="body" tone="muted">
							Ringkasan aktivitas dan konten
						</Typography>
					</AdminPageHeaderContent>
				</AdminPageHeader>

				<AdminPageContent className="gap-6">
					<SectionCards />
					<RecentTryouts />
					<RecentQuestions />
				</AdminPageContent>
			</AdminPageRoot>
		);
	},
});
