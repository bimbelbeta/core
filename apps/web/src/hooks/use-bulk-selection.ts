import { useState } from "react";
import { resolveBulkSelection } from "@/lib/selection";

export function useBulkSelection<T extends string | number>(
	items: { id: T }[] | undefined,
	{ keepSelection = false }: { keepSelection?: boolean } = {},
) {
	const [selectedIds, setSelectedIds] = useState<T[]>([]);
	const ids = items?.map((item) => item.id) ?? [];
	const [shownIds, setShownIds] = useState<T[]>(ids);

	const next = resolveBulkSelection(shownIds, selectedIds, ids, keepSelection);
	if (next) {
		setShownIds(next.shown);
		if (next.selected !== selectedIds) setSelectedIds(next.selected);
	}
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
