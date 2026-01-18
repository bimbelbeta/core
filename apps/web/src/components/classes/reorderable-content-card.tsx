import { Reorder, useDragControls } from "motion/react";
import type { ContentListItem } from "./classes-types";
import { ContentCard } from "./content-card";

export function ReorderableContentCard({
	item,
	index,
	onEdit,
	onDelete,
	completed,
}: {
	item: ContentListItem;
	index: number;
	onEdit?: () => void;
	onDelete?: () => void;
	completed?: boolean;
}) {
	const dragControls = useDragControls();

	return (
		<Reorder.Item value={item} dragListener={false} dragControls={dragControls} className="relative">
			<ContentCard
				item={item}
				index={index}
				onEdit={onEdit}
				onDelete={onDelete}
				completed={completed}
				dragControls={dragControls}
			/>
		</Reorder.Item>
	);
}
