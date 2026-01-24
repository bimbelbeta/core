import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	contentItem,
	contentPracticeQuestions,
	noteMaterial,
	subject,
	videoMaterial,
} from "@bimbelbeta/db/schema/subject";
import { ORPCError } from "@orpc/client";
import { type } from "arktype";
import { and, asc, eq } from "drizzle-orm";
import { admin } from "../..";
import { convertToTiptap } from "../../lib/convert-to-tiptap";

/**
 * Create new subject (class)
 * POST /api/admin/subjects
 */
const createSubject = admin
	.route({
		path: "/admin/subjects",
		method: "POST",
		tags: ["Admin - Classes"],
	})
	.input(
		type({
			name: "string",
			shortName: "string",
			description: "string?",
			order: "number?",
			category: type("'sd' | 'smp' | 'sma' | 'utbk'")?.optional(),
			gradeLevel: "number?",
		}),
	)
	.output(type({ message: "string", id: "number" }))
	.handler(async ({ input }) => {
		// Validate gradeLevel based on category
		if (input.gradeLevel !== undefined && input.gradeLevel !== null) {
			const category = input.category ?? "utbk";
			if (category === "utbk") {
				throw new ORPCError("BAD_REQUEST", {
					message: "UTBK tidak boleh memiliki gradeLevel",
				});
			}

			const validGradeRange: Record<string, [number, number]> = {
				sd: [1, 6],
				smp: [7, 9],
				sma: [10, 12],
			};

			const range = validGradeRange[category];
			if (!range) {
				throw new ORPCError("BAD_REQUEST", {
					message: `Kategori ${category} tidak valid`,
				});
			}

			const [min, max] = range;
			if (input.gradeLevel < min || input.gradeLevel > max) {
				throw new ORPCError("BAD_REQUEST", {
					message: `GradeLevel harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`,
				});
			}
		}

		const [created] = await db
			.insert(subject)
			.values({
				name: input.name,
				shortName: input.shortName,
				description: input.description ?? null,
				order: input.order ?? 1,
				category: input.category ?? "utbk",
				gradeLevel: input.gradeLevel ?? null,
			})
			.returning();

		if (!created)
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal membuat kelas",
			});

		return {
			message: "Kelas berhasil dibuat",
			id: created.id,
		};
	});

/**
 * Update subject (class)
 * PATCH /api/admin/subjects/{id}
 */
const updateSubject = admin
	.route({
		path: "/admin/subjects/{id}",
		method: "PATCH",
		tags: ["Admin - Classes"],
	})
	.input(
		type({
			id: "number",
			name: "string?",
			shortName: "string?",
			description: "string?",
			order: "number?",
			category: type("'sd' | 'smp' | 'sma' | 'utbk'")?.optional(),
			gradeLevel: "number?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		// Validate gradeLevel based on category if both provided or fetch existing
		if (input.gradeLevel !== undefined) {
			let category = input.category;

			// If category not provided, fetch existing
			if (!category) {
				const [existing] = await db
					.select({ category: subject.category })
					.from(subject)
					.where(eq(subject.id, input.id))
					.limit(1);
				if (existing) category = existing.category;
			}

			if (input.gradeLevel !== null && category) {
				if (category === "utbk") {
					throw new ORPCError("BAD_REQUEST", {
						message: "UTBK tidak boleh memiliki gradeLevel",
					});
				}

				const validGradeRange: Record<string, [number, number]> = {
					sd: [1, 6],
					smp: [7, 9],
					sma: [10, 12],
				};

				const range = validGradeRange[category];
				if (!range) {
					throw new ORPCError("BAD_REQUEST", {
						message: `Kategori ${category} tidak valid`,
					});
				}

				const [min, max] = range;
				if (input.gradeLevel < min || input.gradeLevel > max) {
					throw new ORPCError("BAD_REQUEST", {
						message: `GradeLevel harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`,
					});
				}
			}
		}

		const updateData: {
			name?: string;
			shortName?: string;
			description?: string | null;
			order?: number;
			category?: "sd" | "smp" | "sma" | "utbk";
			gradeLevel?: number | null;
			updatedAt: Date;
		} = {
			updatedAt: new Date(),
		};

		if (input.name !== undefined) updateData.name = input.name;
		if (input.shortName !== undefined) updateData.shortName = input.shortName;
		if (input.description !== undefined) updateData.description = input.description ?? null;
		if (input.order !== undefined) updateData.order = input.order;
		if (input.category !== undefined) updateData.category = input.category;
		if (input.gradeLevel !== undefined) updateData.gradeLevel = input.gradeLevel ?? null;

		const [updatedRow] = await db.update(subject).set(updateData).where(eq(subject.id, input.id)).returning();

		if (!updatedRow)
			throw new ORPCError("NOT_FOUND", {
				message: "Kelas tidak ditemukan",
			});

		return { message: "Kelas berhasil diperbarui" };
	});

/**
 * Delete subject (class)
 * DELETE /api/admin/subjects/{id}
 */
const deleteSubject = admin
	.route({
		path: "/admin/subjects/{id}",
		method: "DELETE",
		tags: ["Admin - Classes"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deletedRow] = await db.delete(subject).where(eq(subject.id, input.id)).returning();

		if (!deletedRow)
			throw new ORPCError("NOT_FOUND", {
				message: "Kelas tidak ditemukan",
			});

		return { message: "Kelas berhasil dihapus" };
	});

/**
 * Reorder subtests (classes)
 * PATCH /api/admin/subjects/reorder
 */
const reorderSubjects = admin
	.route({
		path: "/admin/subjects/reorder",
		method: "PATCH",
		tags: ["Admin - Classes"],
	})
	.input(
		type({
			items: "unknown",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const items = input.items as { id: number; order: number }[];

		await db.transaction(async (tx) => {
			for (const item of items) {
				await tx.update(subject).set({ order: item.order, updatedAt: new Date() }).where(eq(subject.id, item.id));
			}
		});

		return { message: "Urutan kelas berhasil diperbarui" };
	});

/**
 * Create new content item
 * POST /api/admin/content
 */
const createContent = admin
	.route({
		path: "/admin/content",
		method: "POST",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			subjectId: "number",
			title: "string",
			order: "number",
			video: "object?",
			note: "object?",
			practiceQuestionIds: "number[]?",
		}),
	)
	.output(
		type({
			message: "string",
			contentId: "number",
			createdMaterials: "object",
		}),
	)
	.handler(async ({ input }) => {
		const hasVideo = input.video !== undefined && input.video !== null;
		const hasNote = input.note !== undefined && input.note !== null;
		const hasPracticeQuestions =
			input.practiceQuestionIds !== undefined &&
			input.practiceQuestionIds !== null &&
			input.practiceQuestionIds.length > 0;

		if (!hasVideo && !hasNote && !hasPracticeQuestions) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Konten harus memiliki minimal salah satu: video, catatan, atau latihan soal",
			});
		}

		// Validate video structure if provided
		if (hasVideo) {
			if (
				typeof input.video !== "object" ||
				!("title" in input.video) ||
				!("videoUrl" in input.video) ||
				!("content" in input.video) ||
				typeof input.video.title !== "string" ||
				typeof input.video.videoUrl !== "string" ||
				!input.video.videoUrl.trim()
			) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Video harus memiliki title, videoUrl, dan content yang valid",
				});
			}
		}

		// Validate note structure if provided
		if (hasNote) {
			if (typeof input.note !== "object" || !("content" in input.note) || typeof input.note.content !== "object") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Catatan harus memiliki content yang valid (Tiptap JSON)",
				});
			}
		}

		// Create content and materials in a transaction
		const result = await db.transaction(async (tx) => {
			// Insert content item
			const [newContent] = await tx
				.insert(contentItem)
				.values({
					subjectId: input.subjectId,
					title: input.title,
					order: input.order,
				})
				.returning();

			if (!newContent)
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Gagal membuat konten",
				});

			const createdMaterials: {
				video?: number;
				note?: number;
				practiceQuestions?: number;
			} = {};

			// Insert video material if provided
			if (hasVideo && input.video) {
				const [video] = await tx
					.insert(videoMaterial)
					.values({
						contentItemId: newContent.id,
						videoUrl: (input.video as { videoUrl: string }).videoUrl,
						content: (input.video as { content: object }).content,
					})
					.returning();

				if (video) createdMaterials.video = video.id;
			}

			// Insert note material if provided
			if (hasNote && input.note) {
				const [note] = await tx
					.insert(noteMaterial)
					.values({
						contentItemId: newContent.id,
						content: (input.note as { content: object }).content,
					})
					.returning();

				if (note) createdMaterials.note = note.id;
			}

			// Insert practice questions if provided
			if (hasPracticeQuestions && input.practiceQuestionIds) {
				await tx.insert(contentPracticeQuestions).values(
					input.practiceQuestionIds.map((questionId: number, index: number) => ({
						contentItemId: newContent.id,
						questionId,
						order: index + 1,
					})),
				);

				createdMaterials.practiceQuestions = input.practiceQuestionIds.length;
			}

			return {
				contentId: newContent.id,
				createdMaterials,
			};
		});

		return {
			message: "Konten berhasil dibuat",
			contentId: result.contentId,
			createdMaterials: result.createdMaterials,
		};
	});

/**
 * Update content item
 * PATCH /api/admin/content/{id}
 */
const updateContent = admin
	.route({
		path: "/admin/content/{id}",
		method: "PATCH",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			id: "number",
			title: "string?",
			order: "number?",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const updateData: { title?: string; order?: number; updatedAt: Date } = {
			updatedAt: new Date(),
		};

		if (input.title !== undefined) updateData.title = input.title;
		if (input.order !== undefined) updateData.order = input.order;

		const [updated] = await db.update(contentItem).set(updateData).where(eq(contentItem.id, input.id)).returning();

		if (!updated)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		return { message: "Konten berhasil diperbarui" };
	});

/**
 * Delete content item
 * DELETE /api/admin/content/{id}
 */
const deleteContent = admin
	.route({
		path: "/admin/content/{id}",
		method: "DELETE",
		tags: ["Admin - Content"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db.delete(contentItem).where(eq(contentItem.id, input.id)).returning();

		if (!deleted)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		return { message: "Konten berhasil dihapus" };
	});

/**
 * Reorder content items
 * PATCH /api/admin/content/reorder
 */
const reorderContent = admin
	.route({
		path: "/admin/content/reorder",
		method: "PATCH",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			subjectId: "number",
			items: "unknown",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		// Validate items array at runtime
		if (!Array.isArray(input.items)) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Items harus berupa array",
			});
		}

		const items = input.items as { id: number; order: number }[];

		// Validate each item
		for (const item of items) {
			if (typeof item.id !== "number" || typeof item.order !== "number") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Setiap item harus memiliki id dan order bertipe number",
				});
			}
		}

		// Use transaction for atomic updates
		// First set all orders to negative values to avoid unique constraint violation
		// Then set them to their final values
		await db.transaction(async (tx) => {
			// Step 1: Set all orders to negative (temporary) values
			for (const [i, item] of items.entries()) {
				await tx
					.update(contentItem)
					.set({ order: -(i + 1000), updatedAt: new Date() })
					.where(and(eq(contentItem.id, item.id), eq(contentItem.subjectId, input.subjectId)));
			}

			// Step 2: Set final order values
			for (const item of items) {
				await tx
					.update(contentItem)
					.set({ order: item.order, updatedAt: new Date() })
					.where(and(eq(contentItem.id, item.id), eq(contentItem.subjectId, input.subjectId)));
			}
		});

		return { message: "Urutan konten berhasil diperbarui" };
	});

/**
 * Add/Update video material
 * POST /api/admin/content/{id}/video
 */
const upsertVideo = admin
	.route({
		path: "/admin/content/{id}/video",
		method: "POST",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			id: "number",
			videoUrl: "string",
			content: "object",
		}),
	)
	.output(type({ message: "string", videoId: "number" }))
	.handler(async ({ input }) => {
		// Validate video URL
		if (!input.videoUrl) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Video URL wajib diisi",
			});
		}

		// Check if content exists
		const [content] = await db
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, input.id))
			.limit(1);

		if (!content)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		// Upsert video material
		const [video] = await db
			.insert(videoMaterial)
			.values({
				contentItemId: input.id,
				videoUrl: input.videoUrl,
				content: input.content,
			})
			.onConflictDoUpdate({
				target: videoMaterial.contentItemId,
				set: {
					videoUrl: input.videoUrl,
					content: input.content,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!video)
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal menyimpan video material",
			});

		return { message: "Video material berhasil disimpan", videoId: video.id };
	});

/**
 * Delete video material
 * DELETE /api/admin/content/{id}/video
 */
const deleteVideo = admin
	.route({
		path: "/admin/content/{id}/video",
		method: "DELETE",
		tags: ["Admin - Content"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db.delete(videoMaterial).where(eq(videoMaterial.contentItemId, input.id)).returning();

		if (!deleted)
			throw new ORPCError("NOT_FOUND", {
				message: "Video material tidak ditemukan",
			});

		return { message: "Video material berhasil dihapus" };
	});

/**
 * Add/Update note material
 * POST /api/admin/content/{id}/note
 */
const upsertNote = admin
	.route({
		path: "/admin/content/{id}/note",
		method: "POST",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			id: "number",
			content: "object", // Tiptap JSON
		}),
	)
	.output(type({ message: "string", noteId: "number" }))
	.handler(async ({ input }) => {
		// Check if content exists
		const [content] = await db
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, input.id))
			.limit(1);

		if (!content)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		// Upsert note material
		const [note] = await db
			.insert(noteMaterial)
			.values({
				contentItemId: input.id,
				content: input.content,
			})
			.onConflictDoUpdate({
				target: noteMaterial.contentItemId,
				set: {
					content: input.content,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!note)
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Gagal menyimpan catatan material",
			});

		return {
			message: "Catatan material berhasil disimpan",
			noteId: note.id,
		};
	});

/**
 * Delete note material
 * DELETE /api/admin/content/{id}/note
 */
const deleteNote = admin
	.route({
		path: "/admin/content/{id}/note",
		method: "DELETE",
		tags: ["Admin - Content"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db.delete(noteMaterial).where(eq(noteMaterial.contentItemId, input.id)).returning();

		if (!deleted)
			throw new ORPCError("NOT_FOUND", {
				message: "Catatan material tidak ditemukan",
			});

		return { message: "Catatan material berhasil dihapus" };
	});

/**
 * Link practice questions to content
 * POST /api/admin/content/{id}/practice-questions
 */
const linkPracticeQuestions = admin
	.route({
		path: "/admin/content/{id}/practice-questions",
		method: "POST",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			id: "number",
			questionIds: "number[]",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		// Delete existing practice question links
		await db.delete(contentPracticeQuestions).where(eq(contentPracticeQuestions.contentItemId, input.id));

		// Insert new practice question links
		if (input.questionIds.length > 0) {
			await db.insert(contentPracticeQuestions).values(
				input.questionIds.map((questionId: number, index: number) => ({
					contentItemId: input.id,
					questionId,
					order: index + 1,
				})),
			);
		}

		return { message: "Latihan soal berhasil dihubungkan ke konten" };
	});

/**
 * Remove all practice questions from content
 * DELETE /api/admin/content/{id}/practice-questions
 */
const unlinkPracticeQuestions = admin
	.route({
		path: "/admin/content/{id}/practice-questions",
		method: "DELETE",
		tags: ["Admin - Content"],
	})
	.input(type({ id: "number" }))
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		await db.delete(contentPracticeQuestions).where(eq(contentPracticeQuestions.contentItemId, input.id));

		return { message: "Latihan soal berhasil dihapus dari konten" };
	});

/**
 * Get practice questions linked to a content item
 * GET /api/admin/content/{id}/practice-questions
 */
const getContentPracticeQuestions = admin
	.route({
		path: "/admin/content/{id}/practice-questions",
		method: "GET",
		tags: ["Admin - Content"],
	})
	.input(type({ id: "number" }))
	.handler(async ({ input }) => {
		// Check if content exists
		const [content] = await db
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, input.id))
			.limit(1);

		if (!content)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		// Get linked questions with their details
		const linkedQuestions = await db
			.select({
				questionId: contentPracticeQuestions.questionId,
				order: contentPracticeQuestions.order,
				type: question.type,
				content: question.content,
				contentJson: question.contentJson,
				discussion: question.discussion,
				discussionJson: question.discussionJson,
				tags: question.tags,
			})
			.from(contentPracticeQuestions)
			.innerJoin(question, eq(contentPracticeQuestions.questionId, question.id))
			.where(eq(contentPracticeQuestions.contentItemId, input.id))
			.orderBy(asc(contentPracticeQuestions.order));

		// Get choices for each question
		const questionIds = linkedQuestions.map((q) => q.questionId);
		const choices =
			questionIds.length > 0
				? await db
						.select()
						.from(questionChoice)
						.where(questionIds.length === 1 ? eq(questionChoice.questionId, questionIds[0]!) : undefined)
				: [];

		// If we have multiple questions, we need to fetch all choices
		let allChoices = choices;
		if (questionIds.length > 1) {
			allChoices = await db.select().from(questionChoice).orderBy(questionChoice.code);
		}

		// Group choices by question id
		const choicesByQuestionId = allChoices.reduce(
			(acc, choice) => {
				const qId = choice.questionId;
				if (!acc[qId]) {
					acc[qId] = [];
				}
				acc[qId].push(choice);
				return acc;
			},
			{} as Record<number, typeof allChoices>,
		);

		return {
			questions: linkedQuestions.map((q) => ({
				questionId: q.questionId,
				order: q.order,
				type: q.type,
				content: q.contentJson ?? convertToTiptap(q.content),
				discussion: q.discussionJson ?? convertToTiptap(q.discussion),
				tags: q.tags ?? [],
				choices: choicesByQuestionId[q.questionId] ?? [],
			})),
		};
	});

/**
 * Remove a single practice question from content
 * DELETE /api/admin/content/{id}/practice-questions/{questionId}
 */
const unlinkSinglePracticeQuestion = admin
	.route({
		path: "/admin/content/{id}/practice-questions/{questionId}",
		method: "DELETE",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			id: "number",
			questionId: "number",
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		const [deleted] = await db
			.delete(contentPracticeQuestions)
			.where(
				and(
					eq(contentPracticeQuestions.contentItemId, input.id),
					eq(contentPracticeQuestions.questionId, input.questionId),
				),
			)
			.returning();

		if (!deleted) {
			throw new ORPCError("NOT_FOUND", {
				message: "Soal tidak ditemukan di konten ini",
			});
		}

		// Re-order remaining questions
		const remaining = await db
			.select({ questionId: contentPracticeQuestions.questionId })
			.from(contentPracticeQuestions)
			.where(eq(contentPracticeQuestions.contentItemId, input.id))
			.orderBy(asc(contentPracticeQuestions.order));

		// Update order for each remaining question
		for (let i = 0; i < remaining.length; i++) {
			await db
				.update(contentPracticeQuestions)
				.set({ order: i + 1 })
				.where(
					and(
						eq(contentPracticeQuestions.contentItemId, input.id),
						eq(contentPracticeQuestions.questionId, remaining[i]!.questionId),
					),
				);
		}

		return { message: "Soal berhasil dihapus dari konten" };
	});

/**
 * Reorder practice questions in a content item
 * PATCH /api/admin/content/{id}/practice-questions/reorder
 */
const reorderPracticeQuestions = admin
	.route({
		path: "/admin/content/{id}/practice-questions/reorder",
		method: "PATCH",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			id: "number",
			questionIds: "number[]", // New order by position in array
		}),
	)
	.output(type({ message: "string" }))
	.handler(async ({ input }) => {
		// Check if content exists
		const [content] = await db
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, input.id))
			.limit(1);

		if (!content)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		// Update order for each question in a transaction
		await db.transaction(async (tx) => {
			// First, set all orders to negative (temporary) values to avoid unique constraint issues
			for (let i = 0; i < input.questionIds.length; i++) {
				const questionId = input.questionIds[i]!;
				await tx
					.update(contentPracticeQuestions)
					.set({ order: -(i + 1000) })
					.where(
						and(
							eq(contentPracticeQuestions.contentItemId, input.id),
							eq(contentPracticeQuestions.questionId, questionId),
						),
					);
			}

			// Then set final order values
			for (let i = 0; i < input.questionIds.length; i++) {
				const questionId = input.questionIds[i]!;
				await tx
					.update(contentPracticeQuestions)
					.set({ order: i + 1 })
					.where(
						and(
							eq(contentPracticeQuestions.contentItemId, input.id),
							eq(contentPracticeQuestions.questionId, questionId),
						),
					);
			}
		});

		return { message: "Urutan latihan soal berhasil diperbarui" };
	});

/**
 * Add practice questions to content (append to existing)
 * POST /api/admin/content/{id}/practice-questions/add
 */
const addPracticeQuestions = admin
	.route({
		path: "/admin/content/{id}/practice-questions/add",
		method: "POST",
		tags: ["Admin - Content"],
	})
	.input(
		type({
			id: "number",
			questionIds: "number[]",
		}),
	)
	.output(type({ message: "string", addedCount: "number" }))
	.handler(async ({ input }) => {
		// Check if content exists
		const [content] = await db
			.select({ id: contentItem.id })
			.from(contentItem)
			.where(eq(contentItem.id, input.id))
			.limit(1);

		if (!content)
			throw new ORPCError("NOT_FOUND", {
				message: "Konten tidak ditemukan",
			});

		// Get existing questions to find max order and avoid duplicates
		const existing = await db
			.select({
				questionId: contentPracticeQuestions.questionId,
				order: contentPracticeQuestions.order,
			})
			.from(contentPracticeQuestions)
			.where(eq(contentPracticeQuestions.contentItemId, input.id));

		const existingIds = new Set(existing.map((e) => e.questionId));
		const maxOrder = existing.length > 0 ? Math.max(...existing.map((e) => e.order)) : 0;

		// Filter out duplicates
		const newQuestionIds = input.questionIds.filter((id) => !existingIds.has(id));

		if (newQuestionIds.length === 0) {
			return { message: "Semua soal sudah ada di konten ini", addedCount: 0 };
		}

		// Insert new questions with proper order
		await db.insert(contentPracticeQuestions).values(
			newQuestionIds.map((questionId, index) => ({
				contentItemId: input.id,
				questionId,
				order: maxOrder + index + 1,
			})),
		);

		return {
			message: `${newQuestionIds.length} soal berhasil ditambahkan`,
			addedCount: newQuestionIds.length,
		};
	});

export const adminSubjectRouter = {
	createSubject,
	updateSubject,
	deleteSubject,
	reorderSubjects,
	createContent,
	updateContent,
	deleteContent,
	reorderContent,
	upsertVideo,
	deleteVideo,
	upsertNote,
	deleteNote,
	linkPracticeQuestions,
	unlinkPracticeQuestions,
	getContentPracticeQuestions,
	unlinkSinglePracticeQuestion,
	reorderPracticeQuestions,
	addPracticeQuestions,
};
