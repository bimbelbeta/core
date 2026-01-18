import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { contentItem, noteMaterial, recentContentView, subject, userProgress, videoMaterial } from "../schema/subject";

const UTBK_DATA = [
	{
		name: "Kemampuan Penalaran Umum",
		shortName: "PU",
		description: "Mengukur kemampuan berpikir logis, analitis, dan kritis melalui penalaran deduktif dan induktif.",
		order: 1,
		category: "utbk" as const,
	},
	{
		name: "Pengetahuan dan Pemahaman Umum",
		shortName: "PPU",
		description: "Mengukur kemampuan memahami dan menganalisis informasi dari berbagai teks dan konteks.",
		order: 2,
		category: "utbk" as const,
	},
	{
		name: "Kemampuan Memahami Bacaan dan Menulis",
		shortName: "PBM",
		description: "Mengukur kemampuan memahami isi bacaan, menemukan ide pokok, dan menyusun kalimat yang efektif.",
		order: 3,
		category: "utbk" as const,
	},
	{
		name: "Pengetahuan Kuantitatif",
		shortName: "PK",
		description: "Mengukur kemampuan menggunakan konsep matematika dasar dan penalaran numerik.",
		order: 4,
		category: "utbk" as const,
	},
	{
		name: "Literasi dalam Bahasa Indonesia",
		shortName: "LBI",
		description: "Mengukur kemampuan memahami, menganalisis, dan mengevaluasi teks berbahasa Indonesia.",
		order: 5,
		category: "utbk" as const,
	},
	{
		name: "Literasi dalam Bahasa Inggris",
		shortName: "LBing",
		description: "Mengukur kemampuan memahami dan menganalisis teks berbahasa Inggris.",
		order: 6,
		category: "utbk" as const,
	},
	{
		name: "Penalaran Matematika",
		shortName: "PM",
		description: "Mengukur kemampuan penalaran dan pemecahan masalah menggunakan konsep matematika tingkat lanjut.",
		order: 7,
		category: "utbk" as const,
	},
];

const SD_DATA = [
	{
		name: "Matematika SD",
		shortName: "MTK-SD",
		description: "Materi matematika untuk siswa Sekolah Dasar.",
		order: 1,
		category: "sd" as const,
	},
	{
		name: "Bahasa Indonesia SD",
		shortName: "BINDO-SD",
		description: "Materi bahasa Indonesia untuk siswa Sekolah Dasar.",
		order: 2,
		category: "sd" as const,
	},
	{
		name: "Ilmu Pengetahuan Alam SD",
		shortName: "IPA-SD",
		description: "Materi IPA untuk siswa Sekolah Dasar.",
		order: 3,
		category: "sd" as const,
	},
	{
		name: "Ilmu Pengetahuan Sosial SD",
		shortName: "IPS-SD",
		description: "Materi IPS untuk siswa Sekolah Dasar.",
		order: 4,
		category: "sd" as const,
	},
];

const SMP_DATA = [
	{
		name: "Matematika SMP",
		shortName: "MTK-SMP",
		description: "Materi matematika untuk siswa Sekolah Menengah Pertama.",
		order: 1,
		category: "smp" as const,
	},
	{
		name: "Bahasa Indonesia SMP",
		shortName: "BINDO-SMP",
		description: "Materi bahasa Indonesia untuk siswa Sekolah Menengah Pertama.",
		order: 2,
		category: "smp" as const,
	},
	{
		name: "Bahasa Inggris SMP",
		shortName: "BING-SMP",
		description: "Materi bahasa Inggris untuk siswa Sekolah Menengah Pertama.",
		order: 3,
		category: "smp" as const,
	},
	{
		name: "Ilmu Pengetahuan Alam SMP",
		shortName: "IPA-SMP",
		description: "Materi IPA untuk siswa Sekolah Menengah Pertama.",
		order: 4,
		category: "smp" as const,
	},
	{
		name: "Ilmu Pengetahuan Sosial SMP",
		shortName: "IPS-SMP",
		description: "Materi IPS untuk siswa Sekolah Menengah Pertama.",
		order: 5,
		category: "smp" as const,
	},
];

const SMA_DATA = [
	{
		name: "Matematika SMA",
		shortName: "MTK-SMA",
		description: "Materi matematika untuk siswa Sekolah Menengah Atas.",
		order: 1,
		category: "sma" as const,
	},
	{
		name: "Bahasa Indonesia SMA",
		shortName: "BINDO-SMA",
		description: "Materi bahasa Indonesia untuk siswa Sekolah Menengah Atas.",
		order: 2,
		category: "sma" as const,
	},
	{
		name: "Bahasa Inggris SMA",
		shortName: "BING-SMA",
		description: "Materi bahasa Inggris untuk siswa Sekolah Menengah Atas.",
		order: 3,
		category: "sma" as const,
	},
	{
		name: "Fisika SMA",
		shortName: "FISIKA-SMA",
		description: "Materi fisika untuk siswa Sekolah Menengah Atas.",
		order: 4,
		category: "sma" as const,
	},
	{
		name: "Kimia SMA",
		shortName: "KIMIA-SMA",
		description: "Materi kimia untuk siswa Sekolah Menengah Atas.",
		order: 5,
		category: "sma" as const,
	},
	{
		name: "Biologi SMA",
		shortName: "BIO-SMA",
		description: "Materi biologi untuk siswa Sekolah Menengah Atas.",
		order: 6,
		category: "sma" as const,
	},
	{
		name: "Ekonomi SMA",
		shortName: "EKONOMI-SMA",
		description: "Materi ekonomi untuk siswa Sekolah Menengah Atas.",
		order: 7,
		category: "sma" as const,
	},
	{
		name: "Sosiologi SMA",
		shortName: "SOSIOLOGI-SMA",
		description: "Materi sosiologi untuk siswa Sekolah Menengah Atas.",
		order: 8,
		category: "sma" as const,
	},
	{
		name: "Sejarah SMA",
		shortName: "SEJARAH-SMA",
		description: "Materi sejarah untuk siswa Sekolah Menengah Atas.",
		order: 9,
		category: "sma" as const,
	},
	{
		name: "Geografi SMA",
		shortName: "GEOGRAFI-SMA",
		description: "Materi geografi untuk siswa Sekolah Menengah Atas.",
		order: 10,
		category: "sma" as const,
	},
];

const SUBJECT_DATA = [...UTBK_DATA, ...SD_DATA, ...SMP_DATA, ...SMA_DATA];

export async function clearSubtest(db: NodePgDatabase) {
	try {
		await db.delete(userProgress);
	} catch {
		console.log("user_progress table not found, skipping clear");
	}

	try {
		await db.delete(recentContentView);
	} catch {
		console.log("recent_content_view table not found, skipping clear");
	}

	try {
		await db.delete(videoMaterial);
	} catch {
		console.log("video_material table not found, skipping clear");
	}

	try {
		await db.delete(noteMaterial);
	} catch {
		console.log("note_material table not found, skipping clear");
	}

	try {
		await db.delete(contentItem);
	} catch {
		console.log("content_item table not found, skipping clear");
	}

	try {
		await db.delete(subject);
	} catch {
		console.log("subject table not found, skipping clear");
	}
}

export async function seedSubtest(db: NodePgDatabase) {
	await db.transaction(async (tx) => {
		const insertedSubjects = await tx.insert(subject).values(SUBJECT_DATA).returning({
			id: subject.id,
			name: subject.name,
			shortName: subject.shortName,
			category: subject.category,
		});

		console.log(`Subject: ${insertedSubjects.length} created`);
		console.log(`  - UTBK: ${insertedSubjects.filter((s) => s.category === "utbk").length}`);
		console.log(`  - SD: ${insertedSubjects.filter((s) => s.category === "sd").length}`);
		console.log(`  - SMP: ${insertedSubjects.filter((s) => s.category === "smp").length}`);
		console.log(`  - SMA: ${insertedSubjects.filter((s) => s.category === "sma").length}`);
	});
}
