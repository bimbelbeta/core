export function extractYouTubeId(url?: string | null): string {
	if (!url) return "";

	const patterns = [
		/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
		/youtu\.be\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match?.[1]) {
			return match[1];
		}
	}

	return "";
}
