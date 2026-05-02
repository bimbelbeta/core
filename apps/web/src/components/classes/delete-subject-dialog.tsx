import { TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";
import type { SubjectListItem } from "./classes-types";

type DeleteSubjectDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subject: SubjectListItem;
};

export function DeleteSubjectDialog({ open, onOpenChange, subject }: DeleteSubjectDialogProps) {
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);

	const deleteMutation = useMutation(
		orpc.admin.subject.remove.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				queryClient.invalidateQueries();
				onOpenChange(false);
				setPending(false);
			},
			onError: (error) => {
				toast.error(error.message || "Gagal menghapus kelas");
				setPending(false);
			},
		}),
	);

	const handleDelete = () => {
		setPending(true);
		deleteMutation.mutate({ id: subject.id });
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Hapus Subject "{subject.name}"?</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan. Semua konten yang terkait dengan subject ini juga akan dihapus.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
					<Button variant="destructive" onClick={handleDelete} disabled={pending}>
						{pending ? (
							"Menghapus..."
						) : (
							<>
								<TrashIcon weight="bold" className="mr-1" />
								Hapus
							</>
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
