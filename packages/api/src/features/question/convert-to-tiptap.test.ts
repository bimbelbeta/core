import { describe, expect, test } from "bun:test";
import { convertToTiptap } from "./convert-to-tiptap";

describe("convertToTiptap", () => {
	test("wraps plain text in paragraph node", () => {
		const result = convertToTiptap("hello world");
		expect(result).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "hello world" }],
				},
			],
		});
	});

	test("parses valid tiptap JSON string", () => {
		const doc = { type: "doc", content: [{ type: "paragraph" }] };
		const result = convertToTiptap(JSON.stringify(doc));
		expect(result).toEqual(doc);
	});

	test("wraps invalid JSON as plain text", () => {
		const result = convertToTiptap("not json");
		expect(result).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "not json" }],
				},
			],
		});
	});

	test("wraps valid JSON without doc type as plain text", () => {
		const obj = { type: "paragraph", content: [] };
		const result = convertToTiptap(JSON.stringify(obj));
		expect(result.type).toBe("doc");
		expect(result.content[0].content[0].text).toBe(JSON.stringify(obj));
	});

	test("handles empty string", () => {
		const result = convertToTiptap("");
		expect(result).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "" }],
				},
			],
		});
	});
});
