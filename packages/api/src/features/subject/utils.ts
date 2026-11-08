export function validateGradeLevel(category: string, gradeLevel: number): { valid: boolean; message?: string } {
	if (category === "utbk") {
		return {
			valid: false,
			message: "UTBK tidak boleh memiliki gradeLevel",
		};
	}

	const validGradeRange: Record<string, [number, number]> = {
		sd: [1, 6],
		smp: [7, 9],
		sma: [10, 12],
	};

	const range = validGradeRange[category];
	if (!range) {
		return {
			valid: false,
			message: `Kategori ${category} tidak valid`,
		};
	}

	const [min, max] = range;
	if (gradeLevel < min || gradeLevel > max) {
		return {
			valid: false,
			message: `GradeLevel harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`,
		};
	}

	return { valid: true };
}
