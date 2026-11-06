import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface PaginationButtonsProps {
	onPrevious: () => void;
	onNext: () => void;
	hasPrevious: boolean;
	hasNext: boolean;
	totalCount?: number;
}

export function PaginationButtons({ onPrevious, onNext, hasPrevious, hasNext, totalCount }: PaginationButtonsProps) {
	return (
		<div className="flex items-center justify-end gap-3">
			{totalCount !== undefined && <p className="text-muted-foreground mr-auto text-xs">Total {totalCount}</p>}
			{(hasPrevious || hasNext) && (
				<nav aria-label="Navigasi halaman" className="flex items-center gap-2">
					<Button variant="outline" size="sm" className="h-9 text-xs" disabled={!hasPrevious} onClick={onPrevious}>
						<CaretLeftIcon className="size-3.5" />
						Sebelumnya
					</Button>
					<Button variant="outline" size="sm" className="h-9 text-xs" disabled={!hasNext} onClick={onNext}>
						Berikutnya
						<CaretRightIcon className="size-3.5" />
					</Button>
				</nav>
			)}
		</div>
	);
}
