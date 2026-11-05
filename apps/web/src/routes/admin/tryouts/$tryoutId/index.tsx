import { ArrowLeftIcon, GearIcon, ListIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { formatDateMedium } from "@/lib/format-date";
import { orpc } from "@/lib/orpc";
import { SUBJECT_CATEGORY_LABELS, TRYOUT_STATUS_BADGE } from "@/lib/schemas";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import { TryoutAttemptsTab } from "./-components/tryout-attempts-tab";
import { type TryoutSettingsFormState, TryoutSettingsTab } from "./-components/tryout-settings-tab";
import { TryoutSubtestsTab } from "./-components/tryout-subtests-tab";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/")({
	staticData: { breadcrumb: "Detail Tryout" },
	component: TryoutDetailPage,
});

function TryoutDetailPage() {
	const { tryoutId: rawTryoutId } = Route.useParams();
	const tryoutId = parseRouteParamToNumber(rawTryoutId);

	const { data, isPending, refetch } = useQuery(
		orpc.admin.tryout.find.queryOptions({
			input: { id: tryoutId },
		}),
	);

	const [settingsFormState, setSettingsFormState] = useState<TryoutSettingsFormState>({
		isDirty: false,
		canSubmit: false,
		isSubmitting: false,
	});

	const handleFormStateChange = useCallback((state: TryoutSettingsFormState) => {
		setSettingsFormState(state);
	}, []);

	const publishMutation = useMutation(
		orpc.admin.tryout.update.mutationOptions({
			onSuccess: () => {
				toast.success("Status tryout berhasil diperbarui");
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	if (!isPending && !data?.tryout) throw notFound();

	const tryout = data?.tryout;
	const subtests = data?.subtests ?? [];

	const handlePublishToggle = () => {
		if (!tryout) return;
		const newStatus = tryout.status === "published" ? "draft" : "published";
		publishMutation.mutate({
			id: tryoutId,
			status: newStatus,
		});
	};

	const formatDateRange = () => {
		if (!tryout) return "Tidak dijadwalkan";
		if (!tryout.startsAt || !tryout.endsAt) {
			if (tryout.startsAt) return `Mulai ${formatDateMedium(tryout.startsAt)}`;
			if (tryout.endsAt) return `Sampai ${formatDateMedium(tryout.endsAt)}`;
			return "Tidak dijadwalkan";
		}
		return `${formatDateMedium(tryout.startsAt)} - ${formatDateMedium(tryout.endsAt)}`;
	};

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
						<div className="flex flex-col gap-1">
							{isPending ? (
								<Skeleton className="h-7 w-48" />
							) : (
								<div className="flex items-center gap-2">
									<Typography variant="title">{tryout!.title}</Typography>
									<Badge variant="outline">{SUBJECT_CATEGORY_LABELS[tryout!.category]}</Badge>
								</div>
							)}
						</div>
					</div>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button
						type="submit"
						form="tryout-settings-form"
						variant="darkBlue"
						disabled={
							isPending || !settingsFormState.isDirty || !settingsFormState.canSubmit || settingsFormState.isSubmitting
						}
					>
						{settingsFormState.isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
					</Button>
					<Button
						onClick={handlePublishToggle}
						disabled={isPending || publishMutation.isPending}
						variant={tryout?.status === "published" ? "outline" : "default"}
					>
						{publishMutation.isPending ? "Memproses..." : tryout?.status === "published" ? "Unpublish" : "Publish"}
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent className="gap-6">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Ringkasan</CardTitle>
					</CardHeader>
					<CardContent>
						{isPending ? (
							<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
								{Array.from({ length: 4 }).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: simple skeleton loader
									<div key={i} className="space-y-1">
										<Skeleton className="h-3 w-16" />
										<Skeleton className="h-5 w-24" />
									</div>
								))}
							</div>
						) : (
							<>
								<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
									<div className="space-y-1">
										<Typography variant="caption" tone="muted" className="tracking-wide uppercase">
											Status
										</Typography>
										<div className="flex items-center gap-2">
											<div className={cn("size-2 rounded-full", TRYOUT_STATUS_BADGE[tryout!.status].dotClassName)} />
											<span className="font-medium">{TRYOUT_STATUS_BADGE[tryout!.status].label}</span>
										</div>
									</div>
									<div className="space-y-1">
										<Typography variant="caption" tone="muted" className="tracking-wide uppercase">
											Kategori
										</Typography>
										<Typography variant="overline">{SUBJECT_CATEGORY_LABELS[tryout!.category]}</Typography>
									</div>
									<div className="space-y-1">
										<Typography variant="caption" tone="muted" className="tracking-wide uppercase">
											Jumlah Subtest
										</Typography>
										<Typography variant="overline">{subtests.length}</Typography>
									</div>
									<div className="space-y-1">
										<Typography variant="caption" tone="muted" className="tracking-wide uppercase">
											Jadwal
										</Typography>
										<Typography variant="overline">{formatDateRange()}</Typography>
									</div>
								</div>
								{tryout!.description && (
									<>
										<Separator className="my-4" />
										<Typography variant="body" tone="muted">
											{tryout!.description}
										</Typography>
									</>
								)}
							</>
						)}
					</CardContent>
				</Card>

				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-10 w-64" />
						<Skeleton className="h-48 w-full" />
					</div>
				) : (
					<Tabs defaultValue="settings" className="w-full">
						<TabsList>
							<TabsTrigger value="settings" className="inline-flex gap-2">
								<GearIcon className="size-4" />
								Pengaturan
							</TabsTrigger>
							<TabsTrigger value="subtests" className="inline-flex gap-2">
								<ListIcon className="size-4" />
								Subtest
								{subtests.length > 0 && (
									<span className="bg-primary/10 text-primary ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium">
										{subtests.length}
									</span>
								)}
							</TabsTrigger>
							<TabsTrigger value="attempts">Attempts</TabsTrigger>
						</TabsList>
						<div className="mt-2">
							<TabsContent value="settings" className="mt-0">
								<TryoutSettingsTab
									tryout={tryout!}
									onUpdate={() => refetch()}
									onFormStateChange={handleFormStateChange}
								/>
							</TabsContent>
							<TabsContent value="subtests" className="mt-0">
								<TryoutSubtestsTab tryoutId={tryoutId} subtests={subtests} onUpdate={() => refetch()} />
							</TabsContent>
							<TabsContent value="attempts">
								<TryoutAttemptsTab subtests={subtests} />
							</TabsContent>
						</div>
					</Tabs>
				)}
			</AdminPageContent>
		</AdminPageRoot>
	);
}
