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
import { orpc } from "@/utils/orpc";
import { BulkAddQuestionsDialog } from "../../-components/bulk-add-questions-dialog";
import { BulkQuestionsTable } from "../../-components/bulk-questions-table";

export const Route = createFileRoute("/admin/tryouts/$tryoutId/subtests/$subtestId")({
	component: SubtestDetailPage,
});

function SubtestDetailPage() {
	const { tryoutId, subtestId } = Route.useParams();
	const sid = Number.parseInt(subtestId, 10);
	const isValidId = !Number.isNaN(sid);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.tryout.questionsBulk.listSubtestQuestions.queryOptions({
			input: { subtestId: isValidId ? sid : 0 },
			enabled: isValidId,
		}),
	);

	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
	const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

	const questions =
		(data?.questions as unknown as Array<{
			id: number;
			order: number;
			question: { id: number; type: "multiple_choice" | "essay"; content: object };
		}>) ?? [];

	const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

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

	if (!isValidId) {
		return <div className="p-6 text-red-500">ID subtest tidak valid</div>;
	}

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
			subtestId: sid,
			questionIds: Array.from(selectedIds),
		});
	};

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/admin/tryouts/$tryoutId" params={{ tryoutId }}>
							<ArrowLeftIcon className="size-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-2xl text-primary-navy-900">Kelola Soal Subtest</h1>
						<p className="text-muted-foreground text-sm">{questions.length} soal di subtest ini</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => setIsBulkAddOpen(true)} className="gap-2">
						<PlusIcon className="size-4" />
						Tambah Soal Massal
					</Button>
					<AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
						<Button
							variant="destructive"
							onClick={() => setIsBulkDeleteOpen(true)}
							disabled={selectedIds.size === 0}
							className="gap-2"
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
				isLoading={isLoading}
				selectedIds={selectedIds}
				onSelectionChange={setSelectedIds}
				onSelectAll={handleSelectAll}
				isAllSelected={isAllSelected}
			/>

			<BulkAddQuestionsDialog
				open={isBulkAddOpen}
				onOpenChange={setIsBulkAddOpen}
				onSuccess={() => refetch()}
				subtestId={sid}
			/>
		</div>
	);
}
