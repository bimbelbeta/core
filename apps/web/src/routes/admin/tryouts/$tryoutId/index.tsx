import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { type } from "arktype";
import {
	AdminBackLink,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { TryoutStatus } from "@/components/admin/tryout-status";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { TryoutAttemptsTab } from "./-components/tryout-attempts-tab";
import { TryoutSettingsTab } from "./-components/tryout-settings-tab";
import { AccessCodeSection } from "./-components/tryout-settings-tab/access-code-section";
import { TryoutSubtestsTab } from "./-components/tryout-subtests-tab";

const TRYOUT_TABS = ["settings", "subtests", "attempts", "access"] as const;

const searchSchema = type({
	"tab?": type.enumerated(...TRYOUT_TABS),
	"subtest?": "number",
});

const isTryoutTab = (value: string): value is (typeof TRYOUT_TABS)[number] => TRYOUT_TABS.some((tab) => tab === value);

export const Route = createFileRoute("/admin/tryouts/$tryoutId/")({
	staticData: { breadcrumb: "Detail tryout", breadcrumbParent: { label: "Tryout", to: "/admin/tryouts" } },
	validateSearch: searchSchema,
	component: TryoutDetailPage,
});

function TryoutDetailPage() {
	const { tryoutId: rawTryoutId } = Route.useParams();
	const tryoutId = parseRouteParamToNumber(rawTryoutId);
	const { tab = "settings", subtest } = Route.useSearch();
	const navigate = useNavigate();

	const { data, isPending, refetch } = useQuery(
		orpc.admin.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	if (!isPending && !data?.tryout) throw notFound();

	const tryout = data?.tryout;
	const subtests = data?.subtests ?? [];

	const handleTabChange = (value: string) => {
		if (!isTryoutTab(value)) return;
		navigate({
			to: "/admin/tryouts/$tryoutId",
			params: { tryoutId: rawTryoutId },
			search: { tab: value, subtest: value === "subtests" ? subtest : undefined },
		});
	};

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminBackLink to="/admin/tryouts">Kembali ke tryout</AdminBackLink>
					{isPending ? (
						<Skeleton className="h-7 w-48" />
					) : (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<Typography variant="title">{tryout!.title}</Typography>
								<TryoutStatus status={tryout!.status} />
							</div>
							<Typography variant="body" tone="muted">
								Dibuat {tryout!.createdAt ? formatDateMedium(new Date(tryout!.createdAt)) : "—"}
							</Typography>
						</>
					)}
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent>
				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-10 w-64" />
						<Skeleton className="h-48 w-full" />
					</div>
				) : (
					<Tabs value={tab} onValueChange={handleTabChange} className="w-full gap-4">
						<TabsList>
							<TabsTrigger value="settings">Pengaturan</TabsTrigger>
							<TabsTrigger value="subtests">
								Subtest
								<span className="bg-muted-foreground/15 text-foreground/80 text-meta rounded-full px-1.5 py-0.5 font-medium tabular-nums">
									{subtests.length}
								</span>
							</TabsTrigger>
							<TabsTrigger value="attempts">Percobaan</TabsTrigger>
							<TabsTrigger value="access">Kode akses</TabsTrigger>
						</TabsList>
						<TabsContent value="settings">
							<TryoutSettingsTab tryout={tryout!} onUpdate={() => refetch()} />
						</TabsContent>
						<TabsContent value="subtests">
							<TryoutSubtestsTab tryoutId={tryoutId} subtests={subtests} onUpdate={() => refetch()} />
						</TabsContent>
						<TabsContent value="attempts">
							<TryoutAttemptsTab subtests={subtests} />
						</TabsContent>
						<TabsContent value="access">
							<AccessCodeSection tryoutId={tryoutId} />
						</TabsContent>
					</Tabs>
				)}
			</AdminPageContent>
		</AdminPageRoot>
	);
}
