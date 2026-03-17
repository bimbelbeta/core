import { type } from "arktype";

export const PaginationInputSchema = type({
	"after?": "string",
	"before?": "string",
	"limit?": "number",
});

export const PageInfoSchema = type({
	hasNextPage: "boolean",
	hasPreviousPage: "boolean",
	startCursor: "string | null",
	endCursor: "string | null",
});

// Type exports
export type PaginationInput = typeof PaginationInputSchema.infer;
export type PageInfo = typeof PageInfoSchema.infer;
export type PaginatedResponse<T> = {
	items: T[];
	pageInfo: PageInfo;
};
