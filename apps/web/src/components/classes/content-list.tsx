import { PlusIcon } from "@phosphor-icons/react";
import { Reorder } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/utils/is-admin";
import type { ContentFilter, ContentListItem } from "./classes-types";
import { ContentCard } from "./content-card";
import { EmptyContentState } from "./empty-content-state";
import { ReorderableContentCard } from "./reorderable-content-card";

/**
 * Check if a content item is completed based on available components
 * A content is completed if all available components are completed
 */
function isContentCompleted(item: ContentListItem): boolean {
	const checks: boolean[] = [];

	// If has video, check if video is completed
	if (item.hasVideo) {
		checks.push(item.videoCompleted === true);
	}

	// If has note, check if note is completed
	if (item.hasNote) {
		checks.push(item.noteCompleted === true);
	}

	// If has practice questions, check if practice questions are completed
	if (item.hasPracticeQuestions) {
		checks.push(item.practiceQuestionsCompleted === true);
	}

	// Content is completed if all available components are completed
	// If no components available, return false
	return checks.length > 0 && checks.every(Boolean);
}

export function ContentList({
	title,
	items,
	isLoading,
	error,
	onCreate,
	onEdit,
	onDelete,
	onReorder,
	userIsPremium,
	userRole,
	subjectId,
	subtestOrder,
	searchQuery,
	showCount,
	hasMore,
	onLoadMore,
	activeFilter,
}: {
	title?: string;
	items?: ContentListItem[];
	isLoading?: boolean;
	error?: string;
	onCreate?: () => void;
	onEdit?: (item: ContentListItem) => void;
	onDelete?: (item: ContentListItem) => void;
	onReorder?: (newItems: ContentListItem[]) => void;
	userIsPremium?: boolean;
	userRole?: string;
	subjectId?: number;
	subtestOrder?: number;
	searchQuery?: string;
	showCount?: boolean;
	hasMore?: boolean;
	onLoadMore?: () => void;
	activeFilter?: ContentFilter;
}) {
	const isAdmin = useIsAdmin();
	const [localItems, setLocalItems] = useState<ContentListItem[]>([]);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (items) {
			setLocalItems(items);
		}
	}, [items]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const handleReorder = (newItems: ContentListItem[]) => {
		setLocalItems(newItems);

		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			if (onReorder) {
				onReorder(newItems);
			}
		}, 800);
	};

	return (
		<div className="">
			<div className="flex items-center justify-between">
				{title && <h3 className="font-semibold text-lg">{title}</h3>}
				{isAdmin && onCreate && activeFilter !== "all" && (
					<Button type="button" variant="destructive" size="sm" onClick={onCreate} className="mb-4">
						<PlusIcon size={16} className="mr-2" weight="bold" />
						Tambah Konten
					</Button>
				)}
				{isLoading && !title && <p className="text-muted-foreground text-xs">Memuat...</p>}
			</div>

			{showCount && searchQuery && items && (
				<p className="mb-4 text-muted-foreground text-sm">
					{items.length} hasil untuk "{searchQuery}"
				</p>
			)}

			{error && <p className="text-red-500 text-sm">{error}</p>}

			{!isLoading && !error && (!localItems || localItems.length === 0) && <EmptyContentState />}

			{localItems &&
				localItems.length > 0 &&
				(isAdmin && onReorder && activeFilter !== "all" ? (
					<Reorder.Group as="div" axis="y" values={localItems} onReorder={handleReorder} className="space-y-2">
						{localItems.map((item, index) => (
							<ReorderableContentCard
								key={item.id}
								item={item}
								index={index}
								onEdit={onEdit ? () => onEdit(item) : undefined}
								onDelete={onDelete ? () => onDelete(item) : undefined}
							/>
						))}
					</Reorder.Group>
				) : (
					<div className="space-y-2">
						{localItems.map((item, index) => (
							<ContentCard
								key={item.id}
								item={item}
								index={index}
								completed={isContentCompleted(item)}
								onEdit={onEdit ? () => onEdit(item) : undefined}
								onDelete={onDelete ? () => onDelete(item) : undefined}
								userIsPremium={userIsPremium}
								userRole={userRole}
								subjectId={subjectId}
								subtestOrder={subtestOrder}
							/>
						))}
					</div>
				))}

			{hasMore && onLoadMore && (
				<div className="flex justify-center pt-4">
					<Button type="button" variant="outline" onClick={onLoadMore}>
						Muat Lebih Banyak
					</Button>
				</div>
			)}
		</div>
	);
}
