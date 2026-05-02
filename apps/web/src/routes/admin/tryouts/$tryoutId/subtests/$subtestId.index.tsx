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
import { parseRouteParamToNumber } from "@/lib/tanstack-router-utils";
import { orpc } from "@/lib/orpc";
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

	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
	const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

	const bulkDeleteMutation = useMutation(
		orpc.admin.tryout.questionsBulk.bulkRemoveQuestionsFromSubtest.mutationOptions({
			onSuccess: (result) => {
				toast.success(`${result.removedCount} soal berhasil dihapus dari subtest`);
				setSelectedIds(new Set());
				setIsBulkDeleteOpen(false);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const questions = data?.questions;
	// ToDO: better to show skeleton here
	if (isPending || !questions) return null;
	const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

	const handleSelectAll = () => {
		if (isAllSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(questions.map((q) => q.id)));
		}
	};

	const handleBulkDelete = () => {
		if (selectedIds.size === 0) return;

		bulkDeleteMutation.mutate({
			subtestId,
			questionIds: Array.from(selectedIds),
		});
	};

	return (
		<div className="flex h-full flex-col gap-6 p-3 sm:p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-start gap-4 sm:items-center">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/tryouts/$tryoutId" params={{ tryoutId: tId }}>
							<ArrowLeftIcon className="size-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-2xl text-primary-navy-900">Kelola Soal Subtest</h1>
						<p className="text-muted-foreground text-sm">{questions.length} soal di subtest ini</p>
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
							disabled={selectedIds.size === 0}
							className="w-full gap-2 sm:w-auto"
						>
							<TrashIcon className="size-4" />
							Hapus {selectedIds.size > 0 && `(${selectedIds.size})`}
						</Button>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Hapus Soal Massal</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah Anda yakin ingin menghapus {selectedIds.size} soal dari subtest ini? Tindakan ini tidak dapat
									dibatalkan.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
									Hapus {selectedIds.size} Soal
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
				onSelectionChange={setSelectedIds}
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
