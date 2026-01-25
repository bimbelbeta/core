import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { studyProgram, university, universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { and, eq } from "drizzle-orm";
import { authed } from "../index";

const get = authed
	.route({
		path: "/user/target",
		method: "GET",
		tags: ["User"],
	})
	.handler(async ({ context }) => {
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
				university: null,
				studyProgram: null,
			};
		}

		const universityData = await db
			.select({
				id: university.id,
				name: university.name,
				slug: university.slug,
				logo: university.logo,
				location: university.location,
			})
			.from(university)
			.where(eq(university.id, userData.targetUniversityId))
			.limit(1);

		const studyProgramData = await db
			.select({
				id: studyProgram.id,
				name: studyProgram.name,
				slug: studyProgram.slug,
				category: studyProgram.category,
			})
			.from(studyProgram)
			.where(eq(studyProgram.id, userData.targetStudyProgramId))
			.limit(1);

		return {
			university: universityData ?? null,
			studyProgram: studyProgramData ?? null,
		};
	});

const set = authed
	.route({
		path: "/user/target",
		method: "PATCH",
		tags: ["User"],
	})
	.input(type({ universityId: "number", studyProgramId: "number" }))
	.handler(async ({ input, context }) => {
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
			throw new Error("Kombinasi universitas dan program studi tidak valid");
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
	get,
	set,
};
