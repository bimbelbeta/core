export function resolveQuestionContent(input: { content: unknown; discussion: unknown }) {
	return {
		contentJson: typeof input.content === "object" ? input.content : null,
		discussionJson: typeof input.discussion === "object" ? input.discussion : null,
		contentText: typeof input.content === "string" ? input.content : JSON.stringify(input.content),
		discussionText: typeof input.discussion === "string" ? input.discussion : JSON.stringify(input.discussion),
	};
}
