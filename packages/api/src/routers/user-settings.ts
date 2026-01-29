import { db } from "@bimbelbeta/db";
import { user } from "@bimbelbeta/db/schema/auth";
import { universityStudyProgram } from "@bimbelbeta/db/schema/university";
import { type } from "arktype";
import { and, eq } from "drizzle-orm";
import { authed } from "../index";

const get = authed
  .route({
    path: "/user/target",
    method: "GET",
    tags: ["User"],
  })
  .handler(async ({ context, errors }) => {
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

    if (!studyProgramData) throw errors.NOT_FOUND({ message: "Gagal menemukan Universitas dan Prodi." });

    return { studyProgramData };
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
