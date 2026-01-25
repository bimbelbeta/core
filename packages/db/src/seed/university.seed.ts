import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { programYearlyData, studyProgram, university, universityStudyProgram } from "../schema/university";

export async function clearUniversities(db: NodePgDatabase) {
	console.log("Clearing universities and related data...");
	// Order matters due to foreign keys
	await db.delete(programYearlyData);
	await db.delete(universityStudyProgram);
	await db.delete(studyProgram);
	await db.delete(university);
}

export async function seedUniversities(db: NodePgDatabase) {
	console.log("Seeding universities...");

	const [ui, itb, ugm] = await db
		.insert(university)
		.values([
			{
				name: "Universitas Indonesia",
				slug: "ui",
				location: "Depok, Jawa Barat",
				website: "https://ui.ac.id",
				rank: 1,
			},
			{
				name: "Institut Teknologi Bandung",
				slug: "itb",
				location: "Bandung, Jawa Barat",
				website: "https://itb.ac.id",
				rank: 2,
			},
			{
				name: "Universitas Gadjah Mada",
				slug: "ugm",
				location: "Yogyakarta, DIY",
				website: "https://ugm.ac.id",
				rank: 3,
			},
		])
		.returning();

	if (!ui || !itb || !ugm) {
		throw new Error("Failed to seed universities");
	}

	console.log("Seeding study programs...");
	const [cs, med, law] = await db
		.insert(studyProgram)
		.values([
			{
				name: "Ilmu Komputer",
				slug: "ilmu-komputer",
				category: "SAINTEK",
			},
			{
				name: "Kedokteran",
				slug: "kedokteran",
				category: "SAINTEK",
			},
			{
				name: "Hukum",
				slug: "hukum",
				category: "SOSHUM",
			},
		])
		.returning();

	if (!cs || !med || !law) {
		throw new Error("Failed to seed study programs");
	}

	console.log("Linking universities to study programs...");
	const [uiCs, itbCs, ugmMed, uiLaw] = await db
		.insert(universityStudyProgram)
		.values([
			{
				universityId: ui.id,
				studyProgramId: cs.id,
				tuition: 15000000,
				capacity: 100,
				accreditation: "Unggul",
			},
			{
				universityId: itb.id,
				studyProgramId: cs.id,
				tuition: 20000000,
				capacity: 120,
				accreditation: "Unggul",
			},
			{
				universityId: ugm.id,
				studyProgramId: med.id,
				tuition: 25000000,
				capacity: 150,
				accreditation: "Unggul",
			},
			{
				universityId: ui.id,
				studyProgramId: law.id,
				tuition: 12000000,
				capacity: 200,
				accreditation: "Unggul",
			},
		])
		.returning();

	if (!uiCs || !itbCs || !ugmMed || !uiLaw) {
		throw new Error("Failed to link universities to study programs");
	}

	console.log("Seeding yearly data...");
	await db.insert(programYearlyData).values([
		{
			universityStudyProgramId: uiCs.id,
			year: 2024,
			averageGrade: 750,
			passingGrade: 720,
			applicantCount: 2000,
			passedCount: 100,
		},
		{
			universityStudyProgramId: uiCs.id,
			year: 2023,
			averageGrade: 740,
			passingGrade: 710,
			applicantCount: 1800,
			passedCount: 100,
		},
		{
			universityStudyProgramId: itbCs.id,
			year: 2024,
			averageGrade: 780,
			passingGrade: 750,
			applicantCount: 2500,
			passedCount: 120,
		},
		{
			universityStudyProgramId: ugmMed.id,
			year: 2024,
			averageGrade: 800,
			passingGrade: 780,
			applicantCount: 4000,
			passedCount: 150,
		},
	]);

	console.log("Universities seeded successfully");
}
