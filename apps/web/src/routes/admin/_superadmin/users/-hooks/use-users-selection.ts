import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { orpc } from "@/lib/orpc";
import { useUsersList } from "./use-users-list";

export function useUsersSelectionState() {
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
	const { data, refetch } = useUsersList();
	const { selectedIds, toggleSelectAll, toggleSelectOne, clearSelection, allSelected, someSelected } = useBulkSelection(
		data?.items,
	);

	const deleteBatchMutation = useMutation(
		orpc.admin.users.deleteBatch.mutationOptions({
			onSuccess: (res) => {
				toast.success(res.message);
				clearSelection();
				setBulkDeleteDialogOpen(false);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleBulkDelete = () => {
		deleteBatchMutation.mutate({ userIds: selectedIds });
	};

	return {
		selectedIds,
		bulkDeleteDialogOpen,
		setBulkDeleteDialogOpen,
		toggleSelectAll,
		toggleSelectOne,
		allSelected,
		someSelected,
		handleBulkDelete,
	};
}
