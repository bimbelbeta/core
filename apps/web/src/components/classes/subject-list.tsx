import { PlusIcon } from "@phosphor-icons/react";
import { Reorder } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useIsAdmin } from "@/hooks/use-is-admin";
import type { SubjectListItem } from "./classes-types";
import { SubjectCard } from "./subject-card";

export function SubjectList({
	items,
	isLoading,
	error,
	onCreate,
	onReorder,
	searchQuery,
}: {
	items?: SubjectListItem[];
	isLoading?: boolean;
	error?: string;
	onCreate?: () => void;
	onReorder?: (newItems: SubjectListItem[]) => void;
	searchQuery?: string;
}) {
	const isAdmin = useIsAdmin();
	const [localItems, setLocalItems] = useState<SubjectListItem[]>([]);
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

	const handleReorder = (newItems: SubjectListItem[]) => {
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
		<div>
			<div className="flex items-center justify-between">
				{isLoading && !error && <Typography variant="caption">Memuat...</Typography>}
				{isAdmin && onCreate && (
					<Button type="button" variant="destructive" size="sm" onClick={onCreate} className="mb-4">
						<PlusIcon size={16} className="mr-2" weight="bold" />
						Tambah Subject
					</Button>
				)}
			</div>

			{error && (
				<Typography variant="body" tone="destructive">
					{error}
				</Typography>
			)}

			{searchQuery && items && items.length > 0 && (
				<Typography variant="body" tone="muted" className="mb-4">
					{items.length} hasil untuk "{searchQuery}"
				</Typography>
			)}

			{!isLoading && !error && (!localItems || localItems.length === 0) && (
				<EmptyState
					title="Tidak ada subject yang ditemukan"
					desc="Coba cari dengan kata kunci lain atau hubungi admin."
				/>
			)}

			{localItems &&
				localItems.length > 0 &&
				(isAdmin && onReorder ? (
					<Reorder.Group as="div" axis="y" values={localItems} onReorder={handleReorder} className="space-y-2">
						{localItems.map((item, _index) => (
							<SubjectCard key={item.id} subject={item} />
						))}
					</Reorder.Group>
				) : (
					<div className="space-y-2">
						{localItems.map((item, _index) => (
							<SubjectCard key={item.id} subject={item} />
						))}
					</div>
				))}
		</div>
	);
}
