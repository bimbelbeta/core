import { cn } from "@/lib/utils";
import type { ContentFilter } from "./classes-types";

const FILTERS: { value: ContentFilter; label: string }[] = [
	{ value: "all", label: "Semua" },
	{ value: "material", label: "Materi" },
	{ value: "tips_and_trick", label: "Tips & Trick" },
];

export function ContentFilters({
	activeFilter,
	onChange,
}: {
	activeFilter: ContentFilter;
	onChange: (filter: ContentFilter) => void;
}) {
	return (
		<div className="flex gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
			{FILTERS.map((filter) => (
				<button
					key={filter.value}
					type="button"
					onClick={() => onChange(filter.value)}
					className={cn(
						"whitespace-nowrap rounded-lg border px-3 py-2 font-normal text-xs transition-all",
						"sm:h-10",
						"border-primary-300 bg-white text-primary-300",
						"hover:bg-primary-50",
						activeFilter === filter.value && "bg-primary-300 text-white",
					)}
				>
					{filter.label}
				</button>
			))}
		</div>
	);
}
