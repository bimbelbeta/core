import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { and, eq } from "drizzle-orm";
import { authed } from "../index";
import type { HandlerOptions } from "../lib/router-definition/handler-options";

const find = authed.userSettings.find.handler(async ({ context }: HandlerOptions<typeof authed.userSettings.find>) => {
	const userId = context.session.user.id;

	const [userData] = await db
		.select({
			targetUniversityId: user.targetUniversityId,
			targetStudyProgramId: user.targetStudyProgramId,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!userData?.targetUniversityId || !userData?.targetStudyProgramId) {
		return {
			studyProgramData: null,
		};
	}

	const studyProgramData = await db.query.universityStudyProgram.findFirst({
		where: and(
			eq(universityStudyProgram.studyProgramId, userData.targetStudyProgramId),
			eq(universityStudyProgram.universityId, userData.targetUniversityId),
		),
		with: {
			studyProgram: true,
			university: true,
		},
	});

	if (!studyProgramData)
		return {
			studyProgramData: null,
		};

	// Transform to match contract schema exactly
	return {
		studyProgramData: {
			id: studyProgramData.id,
			universityId: studyProgramData.universityId,
			studyProgramId: studyProgramData.studyProgramId,
			tuition: studyProgramData.tuition,
			capacity: studyProgramData.capacity,
			accreditation: studyProgramData.accreditation,
			averageScore: studyProgramData.averageScore,
			studyProgram: {
				id: studyProgramData.studyProgram.id,
				name: studyProgramData.studyProgram.name,
				category: studyProgramData.studyProgram.category,
			},
			university: {
				id: studyProgramData.university.id,
				name: studyProgramData.university.name,
				slug: studyProgramData.university.slug,
				logo: studyProgramData.university.logo,
			},
		},
	};
});

const set = authed.userSettings.set.handler(
	async ({ input, context, errors }: HandlerOptions<typeof authed.userSettings.set>) => {
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

		if (!existing) {
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
	},
);

export const userSettingsRouter = {
	find,
	set,
};
