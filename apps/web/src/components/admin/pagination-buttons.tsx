import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface PaginationButtonsProps {
	onPrevious: () => void;
	onNext: () => void;
	hasPrevious: boolean;
	hasNext: boolean;
}

export function PaginationButtons({ onPrevious, onNext, hasPrevious, hasNext }: PaginationButtonsProps) {
	return (
		<div className="flex flex-wrap items-center justify-center gap-2">
			<Button variant="outline" size="sm" disabled={!hasPrevious} onClick={onPrevious}>
				<CaretLeftIcon className="mr-2 size-4" />
				Previous
			</Button>
			<Button variant="outline" size="sm" disabled={!hasNext} onClick={onNext}>
				Next
				<CaretRightIcon className="ml-2 size-4" />
			</Button>
		</div>
	);
}
