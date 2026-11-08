import { formatDateMedium, formatDateTime } from "@/lib/format-date";

export function formatDate(date: Date | string | null | undefined) {
	if (!date) return "-";
	return formatDateMedium(new Date(date));
}

export function formatTimestamp(date: Date | string | null | undefined) {
	if (!date) return "-";
	return formatDateTime(new Date(date));
}
