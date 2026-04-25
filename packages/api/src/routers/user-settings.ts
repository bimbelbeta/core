import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { and, eq } from "drizzle-orm";
import { baseImplementer } from "@/lib/router-definition";
import { rateLimit, requireAuth } from "@/lib/router-definition/middleware";

const authed = baseImplementer.use(requireAuth).use(rateLimit);

const getTarget = authed.userSettings.getTarget.handler(async ({ context, errors }) => {
	if (!context.session.user.targetUniversityId || !context.session.user.targetStudyProgramId)
		return {
			university: null,
			studyProgram: null,
		};

	const [data] = await db
		.select({
			university: {
				id: university.id,
				name: university.name,
				slug: university.slug,
				logo: university.logo,
			},
			studyProgram: {
				id: studyProgram.id,
				name: studyProgram.name,
				slug: studyProgram.slug,
				category: studyProgram.category,
				accreditation: universityStudyProgram.accreditation,
				averageScore: universityStudyProgram.averageScore,
			},
		})
		.from(university)
		.innerJoin(universityStudyProgram, eq(universityStudyProgram.universityId, university.id))
		.innerJoin(studyProgram, eq(studyProgram.id, universityStudyProgram.studyProgramId))
		.where(
			and(
				eq(university.id, context.session.user.targetUniversityId),
				eq(studyProgram.id, context.session.user.targetStudyProgramId),
			),
		);

	if (!data) throw errors.NOT_FOUND();

	return data;
});

const update = authed.userSettings.update.handler(async ({ input, context, errors }) => {
	const { universityId, studyProgramId } = input;
	const userId = context.session.user.id;

	const existing = await db
		.select()
		.from(universityStudyProgram)
		.where(
			and(
				eq(universityStudyProgram.universityId, universityId),
				eq(universityStudyProgram.studyProgramId, studyProgramId),
			),
		)
		.limit(1);

	if (existing.length === 0) {
		throw errors.BAD_REQUEST({
			message: "Kombinasi universitas dan program studi tidak valid",
		});
	}

	await db
		.update(user)
		.set({
			targetUniversityId: universityId,
			targetStudyProgramId: studyProgramId,
		})
		.where(eq(user.id, userId));

	return {
		success: true,
		message: "Target universitas dan program studi berhasil disimpan",
	};
});

export const userSettingsRouter = {
	getTarget,
	update,
};
