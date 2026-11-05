import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useState } from "react";
import { toast } from "sonner";
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
	staticData: { breadcrumb: "Subtest" },
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
		<div className="flex h-full flex-col gap-6 p-3 sm:p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-start gap-4 sm:items-center">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/tryouts/$tryoutId" params={{ tryoutId: tId }} aria-label="Kembali">
							<ArrowLeftIcon className="size-4" />
						</Link>
					</Button>
					<div>
						<Typography variant="title">Kelola Soal Subtest</Typography>
						<Typography variant="body" tone="muted">
							{questions.length} soal di subtest ini
						</Typography>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
					<Button className="w-full gap-2 sm:w-auto" asChild>
						<Link
							to="/admin/tryouts/$tryoutId/subtests/$subtestId/questions/new"
							params={{ tryoutId: tId, subtestId: subtestId.toString() }}
						>
							<PlusIcon className="size-4" />
							Buat Soal
						</Link>
					</Button>
					<Button variant="outline" onClick={() => setIsBulkAddOpen(true)} className="w-full gap-2 sm:w-auto">
						<PlusIcon className="size-4" />
						Tambah Soal Massal
					</Button>
					<AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
						<Button
							variant="destructive"
							onClick={() => setIsBulkDeleteOpen(true)}
							disabled={selectedIds.length === 0}
							className="w-full gap-2 sm:w-auto"
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
				</div>
			</div>

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

			<BulkAddQuestionsDialog
				open={isBulkAddOpen}
				onOpenChange={setIsBulkAddOpen}
				onSuccess={() => refetch()}
				subtestId={subtestId}
			/>
		</div>
	);
}
