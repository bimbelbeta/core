import type { SubjectCategory } from "./classes-types";

export type { SubjectCategory };

export const categoryLabel: Record<SubjectCategory, string> = {
	sd: "SD",
	smp: "SMP",
	sma: "SMA",
	utbk: "UTBK",
};

export const gradeRanges: Record<Exclude<SubjectCategory, "utbk">, [number, number]> = {
	sd: [1, 6],
	smp: [7, 9],
	sma: [10, 12],
};

/** Returns a validation error message if gradeLevel is out of range, or null if valid. */
export function validateGradeLevel(category: Exclude<SubjectCategory, "utbk">, gradeLevel: number): string | null {
	const [min, max] = gradeRanges[category];
	if (gradeLevel < min || gradeLevel > max) {
		return `Grade level harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`;
	}
	return null;
}

export const subtestCardBackground = {
	pu: "bg-secondary-400",
	ppu: "bg-tertiary-400",
	pbm: "bg-fourtiary-300 *:text-white",
	pk: "bg-primary-200 *:text-white",
	lbi: "bg-secondary-400",
	lbing: "bg-tertiary-400",
	pm: "bg-fourtiary-300 *:text-white",
} as const;

export const subtestCardPattern = {
	pu: "bg-secondary-600",
	ppu: "bg-tertiary-200",
	pbm: "bg-fourtiary-200",
	pk: "bg-primary-100",
	lbi: "bg-secondary-600",
	lbing: "bg-tertiary-200",
	pm: "bg-fourtiary-200",
} as const;

export const subtestCardAvatar = {
	pu: "/avatar/subtest-pu-avatar.webp",
	ppu: "/avatar/subtest-ppu-avatar.webp",
	pbm: "/avatar/subtest-pbm-avatar.webp",
	pk: "/avatar/subtest-pk-avatar.webp",
	lbi: "/avatar/subtest-lbi-avatar.webp",
	lbing: "/avatar/subtest-lbing-avatar.webp",
	pm: "/avatar/subtest-pm-avatar.webp",
} as const;
