import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
import { DetailPageSkeleton } from "@/components/admin/detail-page-skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { orpc } from "@/utils/orpc";
import { TryoutSettingsTab } from "./-components/tryout-settings-tab";
import { TryoutSubtestsTab } from "./-components/tryout-subtests-tab";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/")({
	component: TryoutDetailPage,
});

function TryoutDetailPage() {
	const { tryoutId: rawTryoutId } = Route.useParams();
	const tryoutId = parseRouteParamToNumber(rawTryoutId);

	const { data, isPending, refetch } = useQuery(
		orpc.admin.tryout.getTryout.queryOptions({
			input: { id: tryoutId },
		}),
	);

	if (isPending) {
		return <DetailPageSkeleton variant="tryout" />;
	}

	if (!data?.tryout) {
		throw notFound();
	}

	const tryout = data.tryout;
	const subtests = data.subtests ?? [];

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon" asChild>
							<Link to="/admin/tryouts">
								<ArrowLeftIcon className="size-4" />
							</Link>
						</Button>
						<AdminPageTitle>Detail Tryout</AdminPageTitle>
					</div>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions />
			</AdminPageHeader>

			<AdminPageContent>
				<div className="space-y-6">
					<Tabs defaultValue="settings" className="w-full">
						<TabsList>
							<TabsTrigger value="settings">Pengaturan</TabsTrigger>
							<TabsTrigger value="subtests">Subtest</TabsTrigger>
						</TabsList>
						<div className="mt-6">
							<TabsContent value="settings" className="mt-0">
								<TryoutSettingsTab tryout={tryout} onUpdate={() => refetch()} />
							</TabsContent>
							<TabsContent value="subtests" className="mt-0">
								<TryoutSubtestsTab tryoutId={tryoutId} subtests={subtests} onUpdate={() => refetch()} />
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
