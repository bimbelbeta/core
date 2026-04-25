import { convertToTiptap } from "@/lib/convert-to-tiptap";

type TiptapNode = {
	type: string;
	content?: TiptapNode[];
	text?: string;
	[key: string]: unknown;
};

export type TiptapDocument = {
	type: "doc";
	content: TiptapNode[];
};

export function normalizeQuestionContent(input: { content: unknown; discussion: unknown }): {
	contentJson: unknown;
	discussionJson: unknown;
	contentText: string;
	discussionText: string;
} {
	return {
		contentJson: typeof input.content === "object" ? input.content : null,
		discussionJson: typeof input.discussion === "object" ? input.discussion : null,
		contentText: typeof input.content === "string" ? input.content : JSON.stringify(input.content),
		discussionText: typeof input.discussion === "string" ? input.discussion : JSON.stringify(input.discussion),
	};
}

export function readTiptapContent(json: unknown, text: string): TiptapDocument {
	if (
		json != null &&
		typeof json === "object" &&
		(json as Record<string, unknown>).type === "doc" &&
		Array.isArray((json as Record<string, unknown>).content)
	) {
		return json as TiptapDocument;
	}
	return convertToTiptap(text);
}
