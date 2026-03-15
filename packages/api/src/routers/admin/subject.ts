import { db } from "@bimbelbeta/db";
import { question, questionChoice } from "@bimbelbeta/db/schema/question";
import {
	contentItem,
	contentPracticeQuestions,
	noteMaterial,
	subject,
	type subjectCategoryEnum,
	videoMaterial,
} from "@bimbelbeta/db/schema/subject";
import { and, asc, eq, inArray } from "drizzle-orm";
import { admin } from "../..";
import { readTiptapContent } from "../../lib/content-utils";

type SubjectCategory = (typeof subjectCategoryEnum.enumValues)[number];

const VALID_GRADE_RANGE: Record<string, [number, number]> = {
	sd: [1, 6],
	smp: [7, 9],
	sma: [10, 12],
};

function validateGradeLevel(
	gradeLevel: number,
	category: string,
	errors: { BAD_REQUEST: (opts: { message: string }) => Error },
): void {
	if (category === "utbk") {
		throw errors.BAD_REQUEST({
			message: "UTBK tidak boleh memiliki gradeLevel",
		});
	}

	const range = VALID_GRADE_RANGE[category];
	if (!range) {
		throw errors.BAD_REQUEST({
			message: `Kategori ${category} tidak valid`,
		});
	}

	const [min, max] = range;
	if (gradeLevel < min || gradeLevel > max) {
		throw errors.BAD_REQUEST({
			message: `GradeLevel harus antara ${min} dan ${max} untuk kategori ${category.toUpperCase()}`,
		});
	}
}

const createSubject = admin.admin.subject.create.handler(async ({ input, errors }) => {
	if (input.gradeLevel !== undefined && input.gradeLevel !== null) {
		const category = input.category ?? "utbk";
		validateGradeLevel(input.gradeLevel, category, errors);
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
		throw errors.INTERNAL_SERVER_ERROR({
			message: "Gagal membuat kelas",
		});

	return {
		message: "Kelas berhasil dibuat",
		id: created.id,
	};
});

const updateSubject = admin.admin.subject.update.handler(async ({ input, errors }) => {
	if (input.gradeLevel !== undefined) {
		let category = input.category;

		if (!category) {
			const [existing] = await db
				.select({ category: subject.category })
				.from(subject)
				.where(eq(subject.id, input.id))
				.limit(1);
			if (existing) category = existing.category;
		}

		if (input.gradeLevel !== null && category) {
			validateGradeLevel(input.gradeLevel, category, errors);
		}
	}

	const updateData: {
		name?: string;
		shortName?: string;
		description?: string | null;
		order?: number;
		category?: SubjectCategory;
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
		throw errors.NOT_FOUND({
			message: "Kelas tidak ditemukan",
		});

	return { message: "Kelas berhasil diperbarui" };
});

const removeSubject = admin.admin.subject.remove.handler(async ({ input, errors }) => {
	const [deletedRow] = await db.delete(subject).where(eq(subject.id, input.id)).returning();

	if (!deletedRow)
		throw errors.NOT_FOUND({
			message: "Kelas tidak ditemukan",
		});

	return { message: "Kelas berhasil dihapus" };
});

const reorderSubjects = admin.admin.subject.reorder.handler(async ({ input }) => {
	await db.transaction(async (tx) => {
		for (const item of input.items) {
			await tx.update(subject).set({ order: item.order, updatedAt: new Date() }).where(eq(subject.id, item.id));
		}
	});

	return { message: "Urutan kelas berhasil diperbarui" };
});

const createContent = admin.admin.content.createContent.handler(async ({ input, errors }) => {
	const hasVideo = input.video !== undefined;
	const hasNote = input.note !== undefined;
	const hasPracticeQuestions = (input.practiceQuestionIds?.length ?? 0) > 0;

	if (!hasVideo && !hasNote && !hasPracticeQuestions) {
		throw errors.BAD_REQUEST({
			message: "Konten harus memiliki minimal salah satu: video, catatan, atau latihan soal",
		});
	}

	const result = await db.transaction(async (tx) => {
		const [newContent] = await tx
			.insert(contentItem)
			.values({
				subjectId: input.subjectId,
				title: input.title,
				order: input.order,
			})
			.returning();

		if (!newContent)
			throw errors.INTERNAL_SERVER_ERROR({
				message: "Gagal membuat konten",
			});

		const createdMaterials: {
			video?: number;
			note?: number;
			practiceQuestions?: number;
		} = {};

		if (hasVideo) {
			const [video] = await tx
				.insert(videoMaterial)
				.values({
					contentItemId: newContent.id,
					videoUrl: input.video!.videoUrl,
					content: input.video!.content,
				})
				.returning();

			if (video) createdMaterials.video = video.id;
		}

		if (hasNote) {
			const [note] = await tx
				.insert(noteMaterial)
				.values({
					contentItemId: newContent.id,
					content: input.note!.content,
				})
				.returning();

			if (note) createdMaterials.note = note.id;
		}

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

const updateContent = admin.admin.content.updateContent.handler(async ({ input, errors }) => {
	const updateData: { title?: string; order?: number; updatedAt: Date } = {
		updatedAt: new Date(),
	};

	if (input.title !== undefined) updateData.title = input.title;
	if (input.order !== undefined) updateData.order = input.order;

	const [updated] = await db.update(contentItem).set(updateData).where(eq(contentItem.id, input.id)).returning();

	if (!updated)
		throw errors.NOT_FOUND({
			message: "Konten tidak ditemukan",
		});

	return { message: "Konten berhasil diperbarui" };
});

const removeContent = admin.admin.content.removeContent.handler(async ({ input, errors }) => {
	const [deleted] = await db.delete(contentItem).where(eq(contentItem.id, input.id)).returning();

	if (!deleted)
		throw errors.NOT_FOUND({
			message: "Konten tidak ditemukan",
		});

	return { message: "Konten berhasil dihapus" };
});

const reorderContent = admin.admin.content.reorderContent.handler(async ({ input }) => {
	// First set all orders to negative values to avoid unique constraint violation
	// Then set them to their final values
	await db.transaction(async (tx) => {
		// Step 1: Set all orders to negative (temporary) values
		for (const [i, item] of input.items.entries()) {
			await tx
				.update(contentItem)
				.set({ order: -(i + 1000), updatedAt: new Date() })
				.where(and(eq(contentItem.id, item.id), eq(contentItem.subjectId, input.subjectId)));
		}

		// Step 2: Set final order values
		for (const item of input.items) {
			await tx
				.update(contentItem)
				.set({ order: item.order, updatedAt: new Date() })
				.where(and(eq(contentItem.id, item.id), eq(contentItem.subjectId, input.subjectId)));
		}
	});

	return { message: "Urutan konten berhasil diperbarui" };
});

const upsertVideo = admin.admin.content.upsertVideo.handler(async ({ input, errors }) => {
	if (!input.videoUrl) {
		throw errors.BAD_REQUEST({
			message: "Video URL wajib diisi",
		});
	}

	const [content] = await db
		.select({ id: contentItem.id })
		.from(contentItem)
		.where(eq(contentItem.id, input.id))
		.limit(1);

	if (!content)
		throw errors.NOT_FOUND({
			message: "Konten tidak ditemukan",
		});

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
		throw errors.INTERNAL_SERVER_ERROR({
			message: "Gagal menyimpan video material",
		});

	return { message: "Video material berhasil disimpan", videoId: video.id };
});

const removeVideo = admin.admin.content.removeVideo.handler(async ({ input, errors }) => {
	const [deleted] = await db.delete(videoMaterial).where(eq(videoMaterial.contentItemId, input.id)).returning();

	if (!deleted)
		throw errors.NOT_FOUND({
			message: "Video material tidak ditemukan",
		});

	return { message: "Video material berhasil dihapus" };
});

const upsertNote = admin.admin.content.upsertNote.handler(async ({ input, errors }) => {
	const [content] = await db
		.select({ id: contentItem.id })
		.from(contentItem)
		.where(eq(contentItem.id, input.id))
		.limit(1);

	if (!content)
		throw errors.NOT_FOUND({
			message: "Konten tidak ditemukan",
		});

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
		throw errors.INTERNAL_SERVER_ERROR({
			message: "Gagal menyimpan catatan material",
		});

	return {
		message: "Catatan material berhasil disimpan",
		noteId: note.id,
	};
});

const removeNote = admin.admin.content.removeNote.handler(async ({ input, errors }) => {
	const [deleted] = await db.delete(noteMaterial).where(eq(noteMaterial.contentItemId, input.id)).returning();

	if (!deleted)
		throw errors.NOT_FOUND({
			message: "Catatan material tidak ditemukan",
		});

	return { message: "Catatan material berhasil dihapus" };
});

const setPracticeQuestions = admin.admin.content.setPracticeQuestions.handler(async ({ input }) => {
	await db.delete(contentPracticeQuestions).where(eq(contentPracticeQuestions.contentItemId, input.id));

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

const clearPracticeQuestions = admin.admin.content.clearPracticeQuestions.handler(async ({ input }) => {
	await db.delete(contentPracticeQuestions).where(eq(contentPracticeQuestions.contentItemId, input.id));

	return { message: "Latihan soal berhasil dihapus dari konten" };
});

const listPracticeQuestions = admin.admin.content.listPracticeQuestions.handler(async ({ input, errors }) => {
	const [content] = await db
		.select({ id: contentItem.id })
		.from(contentItem)
		.where(eq(contentItem.id, input.id))
		.limit(1);

	if (!content)
		throw errors.NOT_FOUND({
			message: "Konten tidak ditemukan",
		});

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

	const questionIds = linkedQuestions.map((q) => q.questionId);
	const allChoices =
		questionIds.length > 0
			? await db
					.select()
					.from(questionChoice)
					.where(inArray(questionChoice.questionId, questionIds))
					.orderBy(questionChoice.code)
			: [];

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
			content: readTiptapContent(q.contentJson, q.content),
			discussion: readTiptapContent(q.discussionJson, q.discussion),
			tags: q.tags ?? [],
			choices: choicesByQuestionId[q.questionId] ?? [],
		})),
	};
});

const removePracticeQuestion = admin.admin.content.removePracticeQuestion.handler(async ({ input, errors }) => {
	await db.transaction(async (tx) => {
		const [deleted] = await tx
			.delete(contentPracticeQuestions)
			.where(
				and(
					eq(contentPracticeQuestions.contentItemId, input.id),
					eq(contentPracticeQuestions.questionId, input.questionId),
				),
			)
			.returning();

		if (!deleted) {
			throw errors.NOT_FOUND({
				message: "Soal tidak ditemukan di konten ini",
			});
		}

		const remaining = await tx
			.select({ questionId: contentPracticeQuestions.questionId })
			.from(contentPracticeQuestions)
			.where(eq(contentPracticeQuestions.contentItemId, input.id))
			.orderBy(asc(contentPracticeQuestions.order));

		for (let i = 0; i < remaining.length; i++) {
			await tx
				.update(contentPracticeQuestions)
				.set({ order: i + 1 })
				.where(
					and(
						eq(contentPracticeQuestions.contentItemId, input.id),
						eq(contentPracticeQuestions.questionId, remaining[i]!.questionId),
					),
				);
		}
	});

	return { message: "Soal berhasil dihapus dari konten" };
});

const reorderPracticeQuestions = admin.admin.content.reorderPracticeQuestions.handler(async ({ input, errors }) => {
	const [content] = await db
		.select({ id: contentItem.id })
		.from(contentItem)
		.where(eq(contentItem.id, input.id))
		.limit(1);

	if (!content)
		throw errors.NOT_FOUND({
			message: "Konten tidak ditemukan",
		});

	await db.transaction(async (tx) => {
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

const addPracticeQuestions = admin.admin.content.addPracticeQuestions.handler(async ({ input, errors }) => {
	const [content] = await db
		.select({ id: contentItem.id })
		.from(contentItem)
		.where(eq(contentItem.id, input.id))
		.limit(1);

	if (!content)
		throw errors.NOT_FOUND({
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

	const newQuestionIds = input.questionIds.filter((id: number) => !existingIds.has(id));

	if (newQuestionIds.length === 0) {
		return { message: "Semua soal sudah ada di konten ini", addedCount: 0 };
	}

	await db.insert(contentPracticeQuestions).values(
		newQuestionIds.map((questionId: number, index: number) => ({
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
	create: createSubject,
	update: updateSubject,
	remove: removeSubject,
	reorder: reorderSubjects,
};

export const adminContentRouter = {
	createContent,
	updateContent,
	removeContent,
	reorderContent,
	upsertVideo,
	removeVideo,
	upsertNote,
	removeNote,
	setPracticeQuestions,
	clearPracticeQuestions,
	listPracticeQuestions,
	removePracticeQuestion,
	reorderPracticeQuestions,
	addPracticeQuestions,
};
