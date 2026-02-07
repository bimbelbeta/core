import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface PaginationButtonsProps {
	page?: number;
	onPrevious: () => void;
	onNext: () => void;
	hasPrevious: boolean;
	hasNext: boolean;
	showPageInfo?: boolean;
	totalPages?: number;
}

export function PaginationButtons({
	page,
	onPrevious,
	onNext,
	hasPrevious,
	hasNext,
	showPageInfo = true,
	totalPages,
}: PaginationButtonsProps) {
	return (
		<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
			<Button variant="outline" size="sm" disabled={!hasPrevious} onClick={onPrevious}>
				<CaretLeftIcon className="mr-2 size-4" />
				Previous
			</Button>
			{showPageInfo && page !== undefined && (
				<span className="mx-2 text-muted-foreground text-sm">
					Page {page}
					{totalPages !== undefined && ` of ${totalPages}`}
				</span>
			)}
			<Button variant="outline" size="sm" disabled={!hasNext} onClick={onNext}>
				Next
				<CaretRightIcon className="ml-2 size-4" />
			</Button>
		</div>
	);
}
