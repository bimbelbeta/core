import { describe, expect, test } from "bun:test";
import { normalizeQuestionContent, readTiptapContent } from "./content-utils";

// ─── normalizeQuestionContent ───────────────────────────────────────────────────

describe("normalizeQuestionContent", () => {
	test("returns contentJson as-is when content is an object", () => {
		const obj = { type: "doc", content: [] };
		const result = normalizeQuestionContent({ content: obj, discussion: null });
		expect(result.contentJson).toBe(obj);
	});

	test("returns null for contentJson when content is a string", () => {
		const result = normalizeQuestionContent({ content: "hello", discussion: null });
		expect(result.contentJson).toBeNull();
	});

	test("returns contentText as string when content is a string", () => {
		const result = normalizeQuestionContent({ content: "hello world", discussion: null });
		expect(result.contentText).toBe("hello world");
	});

	test("returns JSON.stringify for contentText when content is an object", () => {
		const obj = { type: "doc" };
		const result = normalizeQuestionContent({ content: obj, discussion: null });
		expect(result.contentText).toBe(JSON.stringify(obj));
	});

	test("returns discussionJson as-is when discussion is an object", () => {
		const obj = { type: "doc", content: [] };
		const result = normalizeQuestionContent({ content: null, discussion: obj });
		expect(result.discussionJson).toBe(obj);
	});

	test("returns null for discussionJson when discussion is a string", () => {
		const result = normalizeQuestionContent({ content: null, discussion: "some text" });
		expect(result.discussionJson).toBeNull();
	});

	test("returns discussionText as string when discussion is a string", () => {
		const result = normalizeQuestionContent({ content: null, discussion: "explanation" });
		expect(result.discussionText).toBe("explanation");
	});

	test("returns JSON.stringify for discussionText when discussion is an object", () => {
		const obj = { type: "doc" };
		const result = normalizeQuestionContent({ content: null, discussion: obj });
		expect(result.discussionText).toBe(JSON.stringify(obj));
	});

	test("handles both content and discussion as objects", () => {
		const content = { type: "doc", content: [{ type: "paragraph" }] };
		const discussion = { type: "doc", content: [{ type: "paragraph" }] };
		const result = normalizeQuestionContent({ content, discussion });
		expect(result.contentJson).toBe(content);
		expect(result.discussionJson).toBe(discussion);
	});

	test("handles null for both fields", () => {
		const result = normalizeQuestionContent({ content: null, discussion: null });
		expect(result.contentJson).toBeNull();
		expect(result.discussionJson).toBeNull();
		expect(result.contentText).toBe("null");
		expect(result.discussionText).toBe("null");
	});
});

// ─── readTiptapContent ────────────────────────────────────────────────────

describe("readTiptapContent", () => {
	test("returns json when json is a non-null object", () => {
		const doc: import("./content-utils").TiptapDocument = { type: "doc", content: [{ type: "paragraph" }] };
		const result = readTiptapContent(doc, "fallback text");
		expect(result).toBe(doc);
	});

	test("falls back to convertToTiptap when json is null", () => {
		const result = readTiptapContent(null, "plain text");
		expect(result.type).toBe("doc");
		expect(result.content[0]?.type).toBe("paragraph");
		expect((result.content[0] as { content?: Array<{ text?: string }> } | undefined)?.content?.[0]?.text).toBe(
			"plain text",
		);
	});

	test("falls back to convertToTiptap when json is undefined", () => {
		const result = readTiptapContent(undefined, "some content");
		expect(result.type).toBe("doc");
	});

	test("falls back to convertToTiptap when json is a string", () => {
		const result = readTiptapContent("not an object", "fallback");
		expect(result.type).toBe("doc");
	});

	test("falls back to convertToTiptap when json is a number", () => {
		const result = readTiptapContent(42, "fallback");
		expect(result.type).toBe("doc");
	});

	test("returns json object directly (no copy)", () => {
		const doc = { type: "doc" as const, content: [] };
		expect(readTiptapContent(doc, "")).toBe(doc);
	});
});
