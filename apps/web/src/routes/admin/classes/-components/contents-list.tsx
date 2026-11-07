import { DotsNineIcon, DotsThreeIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Reorder, useDragControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ContentListItem } from "@/components/classes/classes-types";
import { EmptyContentState } from "@/components/classes/empty-content-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Item, ItemActions, ItemContent, ItemHeader, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";

const CONTENT_LINKS = [
	{
		key: "video",
		label: "Video",
		enabled: (i: ContentListItem) => i.hasVideo,
		completed: (i: ContentListItem) => i.videoCompleted,
	},
	{
		key: "notes",
		label: "Catatan",
		enabled: (i: ContentListItem) => i.hasNote,
		completed: (i: ContentListItem) => i.noteCompleted,
	},
	{
		key: "latihan-soal",
		label: "Latihan Soal",
		enabled: (i: ContentListItem) => i.hasPracticeQuestions,
		completed: (i: ContentListItem) => i.practiceQuestionsCompleted,
	},
] as const;

function ContentRow({
	item,
	index,
	subjectId,
	onEdit,
	onDelete,
}: {
	item: ContentListItem;
	index: number;
	subjectId: number;
	onEdit?: (item: ContentListItem) => void;
	onDelete?: (item: ContentListItem) => void;
}) {
	const dragControls = useDragControls();
	const params = { subjectId: subjectId.toString(), contentId: item.id.toString() };

	return (
		<Reorder.Item as="div" value={item} dragListener={false} dragControls={dragControls}>
			<Item variant="outline" size="sm" className="gap-3">
				<ItemMedia
					className="bg-muted/50 size-8 shrink-0 cursor-grab touch-none rounded-md border-none active:cursor-grabbing"
					onPointerDown={(e) => dragControls.start(e)}
				>
					<DotsNineIcon className="text-muted-foreground size-4" weight="bold" />
				</ItemMedia>
				<span className="text-muted-foreground w-6 shrink-0 text-center text-sm font-medium tabular-nums">
					{index + 1}
				</span>
				<ItemContent className="min-w-0">
					<ItemHeader className="justify-start">
						<ItemTitle className="flex-1 truncate">{item.title}</ItemTitle>
					</ItemHeader>
					<div className="flex flex-wrap items-center gap-1.5">
						{CONTENT_LINKS.filter(({ enabled }) => enabled(item)).map(({ key, label, completed }) => (
							<Badge key={key} asChild variant={completed(item) ? "success" : "outline"}>
								<Link to={`/admin/classes/$subjectId/$contentId/${key}`} params={params}>
									{label}
								</Link>
							</Badge>
						))}
					</div>
				</ItemContent>
				<ItemActions>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon-xs" aria-label={`Aksi untuk ${item.title}`}>
								<DotsThreeIcon className="size-4" weight="bold" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => onEdit?.(item)}>
								<PencilSimpleIcon className="size-4" /> Edit judul
							</DropdownMenuItem>
							<DropdownMenuItem variant="destructive" onSelect={() => onDelete?.(item)}>
								<TrashIcon className="size-4" /> Hapus konten
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</ItemActions>
			</Item>
		</Reorder.Item>
	);
}

export function ContentsList({
	items,
	isPending,
	subjectId,
	searchQuery,
	showCount,
	onEdit,
	onDelete,
	onReorder,
	hasMore,
	onLoadMore,
}: {
	items: ContentListItem[];
	isPending?: boolean;
	subjectId: number;
	searchQuery?: string;
	showCount?: boolean;
	onEdit?: (item: ContentListItem) => void;
	onDelete?: (item: ContentListItem) => void;
	onReorder?: (items: ContentListItem[]) => void;
	hasMore?: boolean;
	onLoadMore?: () => void;
}) {
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

	if (isPending) {
		return (
			<div className="flex flex-col gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i.toString()} className="h-14 w-full rounded-md" />
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{showCount && searchQuery && (
				<Typography variant="body" tone="muted">
					{localItems.length} hasil untuk "{searchQuery}"
				</Typography>
			)}

			{(!localItems || localItems.length === 0) && (
				<EmptyContentState
					title={searchQuery ? "Tidak ada hasil" : "Belum ada konten"}
					desc={
						searchQuery ? `Tidak ada konten yang cocok dengan "${searchQuery}".` : "Tambahkan konten untuk subject ini."
					}
				/>
			)}

			{localItems.length > 0 && (
				<Reorder.Group as="div" axis="y" values={localItems} onReorder={handleReorder} className="flex flex-col gap-2">
					{localItems.map((item, index) => (
						<ContentRow
							key={item.id}
							item={item}
							index={index}
							subjectId={subjectId}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</Reorder.Group>
			)}

			{hasMore && onLoadMore && (
				<div className="flex justify-center">
					<Button size="xs" type="button" variant="outline" onClick={onLoadMore}>
						Muat Lebih Banyak
					</Button>
				</div>
			)}
		</div>
	);
}
