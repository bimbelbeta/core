import { cn } from "@/lib/utils";
import type { SubjectFilter } from "./classes-types";

const FILTERS: { value: SubjectFilter; label: string }[] = [
	{ value: "all", label: "Semua Kelas" },
	{ value: "sd", label: "SD" },
	{ value: "smp", label: "SMP" },
	{ value: "sma", label: "SMA" },
	{ value: "utbk", label: "UTBK" },
];

export function SubjectFilters({
	activeFilter,
	onChange,
}: {
	activeFilter: SubjectFilter;
	onChange: (filter: SubjectFilter) => void;
}) {
	return (
		<div className="flex gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
			{FILTERS.map((filter) => (
				<button
					key={filter.value}
					type="button"
					onClick={() => onChange(filter.value)}
					className={cn(
						"rounded-lg border px-3 py-1.5 text-xs font-normal whitespace-nowrap transition-all",
						"sm:h-10",
						"border-primary-600 text-primary-600 bg-white",
						"hover:bg-primary-50",
						activeFilter === filter.value && "bg-primary-500 text-white",
					)}
				>
					{filter.label}
				</button>
			))}
		</div>
	);
}
