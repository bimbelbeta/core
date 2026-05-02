import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
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
import { orpc } from "@/lib/orpc";

interface RestoreProductDialogProps {
	productId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function RestoreProductDialog({ productId, open, onOpenChange, onSuccess }: RestoreProductDialogProps) {
	const restoreMutation = useMutation(
		orpc.admin.products.restore.mutationOptions({
			onSuccess: () => {
				toast.success("Product berhasil dipulihkan");
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
					<DialogTitle>Restore Product</DialogTitle>
					<DialogDescription>
						Product ini akan dipulihkan dan akan muncul kembali di daftar product aktif.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					<Button
						variant="outline"
						className="text-green-600 hover:text-green-700"
						onClick={() => restoreMutation.mutate({ productId })}
						disabled={restoreMutation.isPending}
					>
						<ArrowCounterClockwiseIcon className="size-4" />
						{restoreMutation.isPending ? "Memulihkan..." : "Restore"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
