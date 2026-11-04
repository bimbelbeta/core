import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SUBJECT_CATEGORY_LABELS } from "@/lib/schemas";
import type { SubjectFilter } from "./classes-types";

const FILTERS: { value: SubjectFilter; label: string }[] = [
	{ value: "all", label: "Semua Kelas" },
	...Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => ({
		value: value as SubjectFilter,
		label,
	})),
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
