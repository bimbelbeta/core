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
				if ("text" in node && typeof node.text === "string") {
					text.push(node.text);
				}
				if ("content" in node && Array.isArray(node.content)) {
					for (const child of node.content) {
						extract(child);
					}
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
