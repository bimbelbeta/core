export function formatDateLong(date: Date): string {
	return date.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function formatDateMedium(date: Date): string {
	return date.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatRelativeDate(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const minutes = Math.floor(diffMs / (1000 * 60));
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (minutes < 1) return "Baru saja";
	if (minutes < 60) return `${minutes} menit lalu`;
	if (hours < 24) return `${hours} jam lalu`;
	if (days === 1) return "Kemarin";
	if (days < 7) return `${days} hari lalu`;
	if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
	if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
	return `${Math.floor(days / 365)} tahun lalu`;
}

export function formatDateTime(date: Date): string {
	return date.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
