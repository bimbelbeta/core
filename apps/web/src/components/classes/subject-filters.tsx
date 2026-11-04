import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
		<ToggleGroup
			type="single"
			variant="filter"
			size="none"
			value={activeFilter}
			onValueChange={(value) => {
				const filter = FILTERS.find((filter) => filter.value === value);
				if (filter) onChange(filter.value);
			}}
			aria-label="Kategori kelas"
			className="justify-start overflow-x-auto pb-1 sm:overflow-visible sm:pb-0"
		>
			{FILTERS.map((filter) => (
				<ToggleGroupItem key={filter.value} value={filter.value}>
					{filter.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
