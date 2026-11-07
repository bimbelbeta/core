import { buttonVariants } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SUBJECT_CATEGORY_LABELS, subjectCategorySchema } from "@/lib/schemas";
import type { SubjectFilter } from "./classes-types";

const FILTERS: { value: SubjectFilter; label: string }[] = [
	{ value: "all", label: "Semua kelas" },
	...Object.entries(SUBJECT_CATEGORY_LABELS).map(([value, label]) => ({
		value: subjectCategorySchema.assert(value),
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
				<ToggleGroupItem
					key={filter.value}
					value={filter.value}
					className={buttonVariants({ variant: activeFilter === filter.value ? "default" : "outline", size: "xs" })}
				>
					{filter.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
