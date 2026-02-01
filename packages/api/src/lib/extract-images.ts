/**
 * Extracts all image URLs from TipTap JSON content
 * @param content TipTap JSON content
 * @returns Array of image URLs found in the content
 */
export function extractImageUrls(content: unknown): string[] {
	const urls: string[] = [];

	if (!content || typeof content !== "object") return urls;

	const traverse = (obj: unknown) => {
		if (!obj || typeof obj !== "object") return;

		if (Array.isArray(obj)) {
			obj.forEach(traverse);
		} else {
			const record = obj as Record<string, unknown>;

			// Check if this is an image node
			if (record.type === "image" && typeof record.attrs === "object" && record.attrs) {
				const attrs = record.attrs as Record<string, unknown>;
				if (typeof attrs.src === "string") {
					urls.push(attrs.src);
				}
			}

			// Check for imageUpload node (temporary upload node)
			if (record.type === "imageUpload") {
				// ImageUpload nodes don't have URLs yet, they're placeholders
				return;
			}

			// Traverse all properties
			Object.values(record).forEach(traverse);
		}
	};

	traverse(content);
	return urls;
}

/**
 * Extracts S3 keys from image URLs
 * @param urls Array of image URLs
 * @returns Array of S3 keys
 */
export function extractS3Keys(urls: string[]): string[] {
	return urls
		.map((url) => {
			// Match URLs like http://s3-host/bucket/key
			const match = url.match(/\/temp\/(.+)$/);
			return match?.[1] || null;
		})
		.filter((key): key is string => key !== null);
}
