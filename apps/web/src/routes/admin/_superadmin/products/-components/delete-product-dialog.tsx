import { TrashIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { orpc } from "@/utils/orpc";

interface DeleteProductDialogProps {
	productId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function DeleteProductDialog({ productId, open, onOpenChange, onSuccess }: DeleteProductDialogProps) {
	const deleteMutation = useMutation(
		orpc.admin.products.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Product berhasil dihapus");
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Delete Product</DialogTitle>
					<DialogDescription>Product akan dihapus secara soft delete dan dapat dipulihkan kembali.</DialogDescription>
				</DialogHeader>
				<DialogFooter className="">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					<Button
						variant="destructive"
						onClick={() => deleteMutation.mutate({ productId })}
						disabled={deleteMutation.isPending}
					>
						<TrashIcon className="size-4" />
						{deleteMutation.isPending ? "Menghapus..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
