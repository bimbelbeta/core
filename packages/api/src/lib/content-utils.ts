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
	if (isTiptapDocument(json)) {
		return json;
	}
	return convertToTiptap(text);
}

function isTiptapDocument(json: unknown): json is TiptapDocument {
	return (
		typeof json === "object" &&
		json !== null &&
		"type" in json &&
		json.type === "doc" &&
		"content" in json &&
		Array.isArray(json.content)
	);
}
