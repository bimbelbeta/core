import { TrashIcon } from "@phosphor-icons/react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useUsersSelection } from "./users-selection-context";

export function UsersBulkActions() {
	const { selectedIds, bulkDeleteDialogOpen, setBulkDeleteDialogOpen, handleBulkDelete } = useUsersSelection();
	return (
		<AdminTableBulkActions selectedCount={selectedIds.length}>
			<AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" size="sm">
						<TrashIcon className="mr-2 size-4" />
						Hapus Terpilih
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Multiple User</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus {selectedIds.length} user yang dipilih? Tindakan ini tidak dapat
							dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction onClick={handleBulkDelete} variant="destructive">
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</AdminTableBulkActions>
	);
}
