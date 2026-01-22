import { useMutation } from "@tanstack/react-query";
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
import { orpc } from "@/utils/orpc";

interface DeleteProgramAlertProps {
	universityProgram: {
		id: number;
		studyProgram: {
			name: string;
		};
	};
	onSuccess: () => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteProgramAlert({ universityProgram, onSuccess, open, onOpenChange }: DeleteProgramAlertProps) {
	const { mutate: deleteProgram, isPending: isDeleting } = useMutation(
		orpc.admin.university.universityPrograms.remove.mutationOptions({
			onSuccess: () => {
				toast.success("Program studi berhasil dihapus");
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Hapus Program Studi?</AlertDialogTitle>
					<AlertDialogDescription>
						Anda yakin ingin menghapus <strong>{universityProgram.studyProgram.name}</strong> dari universitas ini?
						Tindakan ini tidak dapat dibatalkan.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={() => deleteProgram({ id: universityProgram.id })}
						disabled={isDeleting}
					>
						{isDeleting ? "Menghapus..." : "Hapus"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
