import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useState } from "react";
import { toast } from "sonner";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { AdminTableBulkActions } from "@/components/admin/admin-table-toolbar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { orpc } from "@/lib/orpc";
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { BulkAddQuestionsDialog } from "../../-components/bulk-add-questions-dialog";
import { BulkQuestionsTable } from "../../-components/bulk-questions-table";
import { ScoringMapEditor } from "../../-components/scoring-map-editor";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/subtests/$subtestId/")({
	staticData: { breadcrumb: "Subtest", breadcrumbParent: { label: "Tryout", to: "/admin/tryouts/$tryoutId" } },
	component: SubtestDetailPage,
});

function SubtestDetailPage() {
	const { tryoutId: tId, subtestId: rawSubtestId } = Route.useParams();
	const subtestId = parseRouteParamToNumber(rawSubtestId);

	const { data, isPending, refetch } = useQuery(
		orpc.admin.tryout.questionsBulk.list.queryOptions({
			input: { subtestId },
		}),
	);

	const { data: subtestData, refetch: refetchSubtest } = useQuery(
		orpc.admin.tryout.subtest.find.queryOptions({
			input: { id: subtestId },
		}),
	);

	const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
	const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

	const bulkDeleteMutation = useMutation(
		orpc.admin.tryout.questionsBulk.bulkRemoveQuestionsFromSubtest.mutationOptions({
			onSuccess: (result) => {
				toast.success(`${result.removedCount} soal berhasil dihapus dari subtest`);
				clearSelection();
				setIsBulkDeleteOpen(false);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const questions = data?.questions;
	const {
		selectedIds,
		toggleSelectAll: handleSelectAll,
		toggleSelectOne,
		clearSelection,
		allSelected: isAllSelected,
	} = useBulkSelection(questions);

	if (isPending || !questions) return null;

	const handleBulkDelete = () => {
		if (selectedIds.length === 0) return;

		bulkDeleteMutation.mutate({
			subtestId,
			questionIds: selectedIds,
		});
	};

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" asChild>
							<Link to="/admin/tryouts/$tryoutId" params={{ tryoutId: tId }} aria-label="Kembali">
								<ArrowLeftIcon className="size-4" />
							</Link>
						</Button>
						<Typography variant="title">{subtestData?.name ?? "Subtest"}</Typography>
					</div>
					<Typography variant="body" tone="muted">
						{questions.length} soal
						{subtestData?.duration ? ` · ${subtestData.duration} menit` : ""}
						{subtestData?.questionOrder === "random" ? " · soal acak" : " · soal berurutan"}
					</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button className="gap-2" asChild>
						<Link
							to="/admin/tryouts/$tryoutId/subtests/$subtestId/questions/new"
							params={{ tryoutId: tId, subtestId: subtestId.toString() }}
						>
							<PlusIcon className="size-4" />
							Buat soal
						</Link>
					</Button>
					<Button variant="outline" onClick={() => setIsBulkAddOpen(true)} className="gap-2">
						<PlusIcon className="size-4" />
						Tambah soal massal
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent>
				<AdminTableBulkActions selectedCount={selectedIds.length}>
					<AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
						<Button
							variant="destructive"
							onClick={() => setIsBulkDeleteOpen(true)}
							disabled={selectedIds.length === 0}
							className="gap-2"
						>
							<TrashIcon className="size-4" />
							Hapus {selectedIds.length > 0 && `(${selectedIds.length})`}
						</Button>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Hapus Soal Massal</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah Anda yakin ingin menghapus {selectedIds.length} soal dari subtest ini? Tindakan ini tidak dapat
									dibatalkan.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction onClick={handleBulkDelete} variant="destructive">
									Hapus {selectedIds.length} Soal
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</AdminTableBulkActions>

				<BulkQuestionsTable
					questions={questions}
					isPending={isPending}
					selectedIds={selectedIds}
					onToggleOne={toggleSelectOne}
					onSelectAll={handleSelectAll}
					isAllSelected={isAllSelected}
				/>

				<ScoringMapEditor
					subtestId={subtestId}
					questionCount={questions.length}
					initialScoringMap={subtestData?.scoringMap}
					onSaveSuccess={() => refetchSubtest()}
				/>
			</AdminPageContent>

			<BulkAddQuestionsDialog
				open={isBulkAddOpen}
				onOpenChange={setIsBulkAddOpen}
				onSuccess={() => refetch()}
				subtestId={subtestId}
			/>
		</AdminPageRoot>
	);
}
