import { type SubjectCategory, subjectCategorySchema } from "@/lib/schemas";

export const gradeRanges: Record<Exclude<SubjectCategory, "utbk">, [number, number]> = {
	sd: [1, 6],
	smp: [7, 9],
	sma: [10, 12],
};

export function isValidCategory(v: string): v is SubjectCategory {
	return subjectCategorySchema.allows(v);
}

/** Returns a validation error message if gradeLevel is out of range, or null if valid. */
export function validateGradeLevel(category: Exclude<SubjectCategory, "utbk">, gradeLevel: number): string | null {
	const [min, max] = gradeRanges[category];
	if (gradeLevel < min || gradeLevel > max) {
		return `Grade level harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`;
	}
	return null;
}
