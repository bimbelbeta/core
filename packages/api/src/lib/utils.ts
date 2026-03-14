export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]+/g, "");
}

export function numericToNumber(val: string | null): number | null {
	return val ? Number(val) : null;
}
