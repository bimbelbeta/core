import { useState } from "react";

export function useBulkSelection<T extends string | number>(items: { id: T }[] | undefined) {
	const [selectedIds, setSelectedIds] = useState<T[]>([]);
	const allSelected = !!items?.length && items.every((item) => selectedIds.includes(item.id));

	const toggleSelectAll = () => {
		setSelectedIds(allSelected ? [] : (items?.map((item) => item.id) ?? []));
	};

	const toggleSelectOne = (id: T) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
	};

	const clearSelection = () => setSelectedIds([]);

	return {
		selectedIds,
		toggleSelectAll,
		toggleSelectOne,
		clearSelection,
		allSelected,
		someSelected: selectedIds.length > 0 && !allSelected,
	};
}
