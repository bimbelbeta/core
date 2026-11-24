import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@bimbelbeta/db";
import { question } from "@bimbelbeta/db/schema/question";
import { call } from "@orpc/server";
import { inArray } from "drizzle-orm";
import type { Session } from "@/context";
import { appRouter } from "@/routers";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL;
const marker = `gallery-${crypto.randomUUID()}`;
const now = new Date();
const session = {
	user: {
		id: marker,
		name: "Gallery integration test",
		email: `${marker}@example.com`,
		emailVerified: true,
		image: null,
		createdAt: now,
		updatedAt: now,
		role: "admin",
		isPremium: false,
		premiumExpiresAt: null,
		tryoutCredits: 0,
		targetUniversityId: null,
		targetStudyProgramId: null,
	},
	session: {
		id: marker,
		userId: marker,
		token: marker,
		expiresAt: new Date("2100-01-01"),
		createdAt: now,
		updatedAt: now,
		ipAddress: null,
		userAgent: null,
	},
} satisfies Session;
const options = { context: { session } };
const endpoint = appRouter.admin.tryout.questions.listImages;
const ids: number[] = [];
const url = (name: string) => `https://example.com/${marker}/${name}.png`;
const a = url("a");
const b = url("b");
const c = url("c");
const image = (src: unknown) => ({ type: "image", attrs: { src } });
const paragraph = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
const doc = (...content: unknown[]) => ({ type: "doc", content });
let newestId: number;

async function seed(contentJson: unknown, discussionJson: unknown, content = "legacy text", createdAt: Date | null = null) {
	const [row] = await db.insert(question).values({
		type: "essay",
		content,
		discussion: "",
		contentJson,
		discussionJson,
		createdAt,
	}).returning({ id: question.id });
	if (!row) throw new Error("Gagal membuat data pengujian galeri");
	ids.push(row.id);
	return row.id;
}

const list = (input: { limit?: number; after?: string; before?: string; search?: string } = {}) =>
	call(endpoint, { search: marker, ...input }, options);

describe.skipIf(!enabled)("question image gallery", () => {
	beforeAll(async () => {
		await seed(doc(paragraph("Old question"), image(a), image(a), image(b)), null, "legacy text", now);
		newestId = await seed(
			doc(paragraph(`Unique preview ${marker}`), {
				type: "blockquote",
				content: [image(a)],
			}),
			doc(image(a), image(c), image(""), image(42), { type: "image", attrs: {} }),
		);
		await seed(null, null, `https://example.com/${marker}/not-an-image.png`);
		await seed(doc(paragraph("No image"), { type: "link", attrs: { src: url("not-image") } }), null);
	});

	afterAll(async () => {
		if (ids.length) await db.delete(question).where(inArray(question.id, ids));
	});

	test("returns distinct image URLs from nested content and discussion", async () => {
		const result = await list();
		expect(result.items.map((item) => item.url)).toEqual([c, b, a]);
		expect(result.items.find((item) => item.url === a)).toEqual({
			url: a,
			questionId: newestId,
			questionPreview: `Unique preview ${marker}`,
			createdAt: null,
		});
		expect(result.items.find((item) => item.url === b)?.createdAt).toEqual(now);
		expect(result.pageInfo.hasNextPage).toBe(false);
		expect(result.pageInfo.hasPreviousPage).toBe(false);
	});

	test("searches URLs and question preview without interpreting wildcards", async () => {
		expect((await list({ search: `${marker.toUpperCase()}/B.PNG` })).items.map((item) => item.url)).toEqual([b]);
		expect((await list({ search: `Unique preview ${marker}` })).items.map((item) => item.url)).toEqual([c, a]);
		expect((await list({ search: `${marker}/_.png` })).items).toEqual([]);
	});

	test("uses forward and backward URL cursors without missing same-question images", async () => {
		const first = await list({ limit: 1 });
		expect(first.items.map((item) => item.url)).toEqual([c]);
		expect(first.pageInfo.hasNextPage).toBe(true);
		expect(first.pageInfo.hasPreviousPage).toBe(false);
		const next = await list({ limit: 1, after: first.pageInfo.endCursor! });
		expect(next.items.map((item) => item.url)).toEqual([b]);
		expect(next.pageInfo.hasNextPage).toBe(true);
		expect(next.pageInfo.hasPreviousPage).toBe(true);
		const last = await list({ limit: 1, after: next.pageInfo.endCursor! });
		expect(last.items.map((item) => item.url)).toEqual([a]);
		expect(last.pageInfo.hasNextPage).toBe(false);
		const previous = await list({ limit: 1, before: last.pageInfo.startCursor! });
		expect(previous).toEqual(next);
		expect(await list({ limit: 1, before: previous.pageInfo.startCursor! })).toEqual(first);
	});

	test("returns an empty page when no URL matches", async () => {
		expect(await list({ search: `${marker}/missing` })).toEqual({
			items: [],
			pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
		});
	});

	test("rejects invalid pagination input", async () => {
		for (const input of [{ limit: 0 }, { limit: -1 }, { limit: 1.5 }, { after: "!" }, { before: "" }]) {
			await expect(list(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
		}
		const first = await list({ limit: 1 });
		await expect(list({ after: first.pageInfo.endCursor!, before: first.pageInfo.startCursor! }))
			.rejects.toMatchObject({ code: "BAD_REQUEST" });
	});
});
