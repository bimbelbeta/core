import { formatDateMedium } from "@/lib/format-date";

export function formatDate(date: Date | string | null | undefined) {
	if (!date) return "-";
	return formatDateMedium(new Date(date));
}
