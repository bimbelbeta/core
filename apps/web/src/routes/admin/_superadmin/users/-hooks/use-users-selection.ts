import { useMutation } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc";
import { useUsersList } from "./use-users-list";

export const UsersSelectionContext = createContext<ReturnType<typeof useUsersSelectionState> | null>(null);

export function useUsersSelectionState() {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
	const { data, refetch } = useUsersList();

	const deleteBatchMutation = useMutation(
		orpc.admin.users.deleteBatch.mutationOptions({
			onSuccess: (res) => {
				toast.success(res.message);
				setSelectedIds([]);
				setBulkDeleteDialogOpen(false);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const toggleSelectAll = () => {
		if (selectedIds.length === (data?.items.length ?? 0)) {
			setSelectedIds([]);
		} else {
			setSelectedIds(data?.items.map((u) => u.id) ?? []);
		}
	};

	const toggleSelectOne = (id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
	};

	const allSelected = selectedIds.length === (data?.items.length ?? 0) && (data?.items.length ?? 0) > 0;
	const someSelected = selectedIds.length > 0 && selectedIds.length < (data?.items.length ?? 0);

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

export function useUsersSelection() {
	const selection = useContext(UsersSelectionContext);
	if (!selection) throw new Error("Konteks pemilihan user tidak tersedia");
	return selection;
}
