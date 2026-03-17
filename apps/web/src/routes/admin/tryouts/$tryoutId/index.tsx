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
	AdminPageTitle,
} from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { TryoutAttemptsTab } from "./-components/tryout-attempts-tab";
import { type TryoutSettingsFormState, TryoutSettingsTab } from "./-components/tryout-settings-tab";
import { TryoutSubtestsTab } from "./-components/tryout-subtests-tab";
import { CATEGORY_LABELS } from "./-constants";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/")({
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
		orpc.admin.tryout.updateTryout.mutationOptions({
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
		if (!tryout.startsAt && !tryout.endsAt) return "Tidak dijadwalkan";
		if (tryout.startsAt && !tryout.endsAt) {
			return `Mulai ${new Date(tryout.startsAt).toLocaleDateString("id-ID")}`;
		}
		if (!tryout.startsAt && tryout.endsAt) {
			return `Sampai ${new Date(tryout.endsAt).toLocaleDateString("id-ID")}`;
		}
		const start = new Date(tryout.startsAt!).toLocaleDateString("id-ID");
		const end = new Date(tryout.endsAt!).toLocaleDateString("id-ID");
		return `${start} - ${end}`;
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
									<AdminPageTitle className="text-xl">{tryout!.title}</AdminPageTitle>
									<Badge variant="outline">{CATEGORY_LABELS[tryout!.category]}</Badge>
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
										<p className="text-muted-foreground text-xs uppercase tracking-wide">Status</p>
										<div className="flex items-center gap-2">
											<div
												className={cn("size-2 rounded-full", {
													"bg-green-500": tryout!.status === "published",
													"bg-gray-400": tryout!.status === "draft",
													"bg-red-500": tryout!.status === "archived",
												})}
											/>
											<span className="font-medium capitalize">{tryout!.status}</span>
										</div>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-xs uppercase tracking-wide">Kategori</p>
										<p className="font-medium">{CATEGORY_LABELS[tryout!.category]}</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-xs uppercase tracking-wide">Jumlah Subtest</p>
										<p className="font-medium">{subtests.length}</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground text-xs uppercase tracking-wide">Jadwal</p>
										<p className="font-medium text-sm">{formatDateRange()}</p>
									</div>
								</div>
								{tryout!.description && (
									<>
										<Separator className="my-4" />
										<p className="text-muted-foreground text-sm">{tryout!.description}</p>
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
									<span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs">
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
								<TryoutAttemptsTab />
							</TabsContent>
						</div>
					</Tabs>
				)}
			</AdminPageContent>
		</AdminPageRoot>
	);
}
