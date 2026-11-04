import { useState } from "react";

export function useBulkSelection(items: { id: string }[] | undefined) {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const total = items?.length ?? 0;

	const toggleSelectAll = () => {
		setSelectedIds(selectedIds.length === total ? [] : (items?.map((item) => item.id) ?? []));
	};

	const toggleSelectOne = (id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
	};

	const clearSelection = () => setSelectedIds([]);

	return {
		selectedIds,
		toggleSelectAll,
		toggleSelectOne,
		clearSelection,
		allSelected: selectedIds.length === total && total > 0,
		someSelected: selectedIds.length > 0 && selectedIds.length < total,
	};
}
