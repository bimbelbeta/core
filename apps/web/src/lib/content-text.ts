/**
 * Extracts plain text from a Tiptap/ProseMirror document or HTML string.
 * Handles both JSON document objects and raw HTML strings.
 */
export function extractTextFromTiptap(content: unknown): string {
	if (typeof content === "string") {
		return content.replace(/<[^>]*>/g, " ").trim();
	}
	if (typeof content === "object" && content !== null) {
		const text: string[] = [];
		const extract = (node: unknown) => {
			if (typeof node === "string") {
				text.push(node);
			} else if (typeof node === "object" && node !== null) {
				const obj = node as Record<string, unknown>;
				if (obj.text && typeof obj.text === "string") {
					text.push(obj.text);
				}
				if (Array.isArray(obj.content)) {
					obj.content.forEach(extract);
				}
			}
		};
		extract(content);
		return text.join(" ").trim();
	}
	return String(content ?? "")
		.replace(/<[^>]*>/g, " ")
		.trim();
}

export function truncateText(text: string, maxLength = 120): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trim()}...`;
}
