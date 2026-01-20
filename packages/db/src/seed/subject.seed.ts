import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
	contentItem,
	contentPracticeQuestions,
	noteMaterial,
	recentContentView,
	subject,
	userProgress,
	videoMaterial,
} from "../schema/subject";

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
		gradeLevel: 6,
	},
	{
		name: "Bahasa Indonesia SD",
		shortName: "BINDO-SD",
		description: "Materi bahasa Indonesia untuk siswa Sekolah Dasar.",
		order: 2,
		category: "sd" as const,
		gradeLevel: 5,
	},
	{
		name: "Ilmu Pengetahuan Alam SD",
		shortName: "IPA-SD",
		description: "Materi IPA untuk siswa Sekolah Dasar.",
		order: 3,
		category: "sd" as const,
		gradeLevel: 6,
	},
	{
		name: "Ilmu Pengetahuan Sosial SD",
		shortName: "IPS-SD",
		description: "Materi IPS untuk siswa Sekolah Dasar.",
		order: 4,
		category: "sd" as const,
		gradeLevel: 5,
	},
];

const SMP_DATA = [
	{
		name: "Matematika SMP",
		shortName: "MTK-SMP",
		description: "Materi matematika untuk siswa Sekolah Menengah Pertama.",
		order: 1,
		category: "smp" as const,
		gradeLevel: 9,
	},
	{
		name: "Bahasa Indonesia SMP",
		shortName: "BINDO-SMP",
		description: "Materi bahasa Indonesia untuk siswa Sekolah Menengah Pertama.",
		order: 2,
		category: "smp" as const,
		gradeLevel: 8,
	},
	{
		name: "Bahasa Inggris SMP",
		shortName: "BING-SMP",
		description: "Materi bahasa Inggris untuk siswa Sekolah Menengah Pertama.",
		order: 3,
		category: "smp" as const,
		gradeLevel: 9,
	},
	{
		name: "Ilmu Pengetahuan Alam SMP",
		shortName: "IPA-SMP",
		description: "Materi IPA untuk siswa Sekolah Menengah Pertama.",
		order: 4,
		category: "smp" as const,
		gradeLevel: 8,
	},
	{
		name: "Ilmu Pengetahuan Sosial SMP",
		shortName: "IPS-SMP",
		description: "Materi IPS untuk siswa Sekolah Menengah Pertama.",
		order: 5,
		category: "smp" as const,
		gradeLevel: 9,
	},
];

const SMA_DATA = [
	{
		name: "Matematika SMA",
		shortName: "MTK-SMA",
		description: "Materi matematika untuk siswa Sekolah Menengah Atas.",
		order: 1,
		category: "sma" as const,
		gradeLevel: 12,
	},
	{
		name: "Bahasa Indonesia SMA",
		shortName: "BINDO-SMA",
		description: "Materi bahasa Indonesia untuk siswa Sekolah Menengah Atas.",
		order: 2,
		category: "sma" as const,
		gradeLevel: 11,
	},
	{
		name: "Bahasa Inggris SMA",
		shortName: "BING-SMA",
		description: "Materi bahasa Inggris untuk siswa Sekolah Menengah Atas.",
		order: 3,
		category: "sma" as const,
		gradeLevel: 12,
	},
	{
		name: "Fisika SMA",
		shortName: "FISIKA-SMA",
		description: "Materi fisika untuk siswa Sekolah Menengah Atas.",
		order: 4,
		category: "sma" as const,
		gradeLevel: 11,
	},
	{
		name: "Kimia SMA",
		shortName: "KIMIA-SMA",
		description: "Materi kimia untuk siswa Sekolah Menengah Atas.",
		order: 5,
		category: "sma" as const,
		gradeLevel: 11,
	},
	{
		name: "Biologi SMA",
		shortName: "BIO-SMA",
		description: "Materi biologi untuk siswa Sekolah Menengah Atas.",
		order: 6,
		category: "sma" as const,
		gradeLevel: 12,
	},
	{
		name: "Ekonomi SMA",
		shortName: "EKONOMI-SMA",
		description: "Materi ekonomi untuk siswa Sekolah Menengah Atas.",
		order: 7,
		category: "sma" as const,
		gradeLevel: 10,
	},
	{
		name: "Sosiologi SMA",
		shortName: "SOSIOLOGI-SMA",
		description: "Materi sosiologi untuk siswa Sekolah Menengah Atas.",
		order: 8,
		category: "sma" as const,
		gradeLevel: 10,
	},
	{
		name: "Sejarah SMA",
		shortName: "SEJARAH-SMA",
		description: "Materi sejarah untuk siswa Sekolah Menengah Atas.",
		order: 9,
		category: "sma" as const,
		gradeLevel: 11,
	},
	{
		name: "Geografi SMA",
		shortName: "GEOGRAFI-SMA",
		description: "Materi geografi untuk siswa Sekolah Menengah Atas.",
		order: 10,
		category: "sma" as const,
		gradeLevel: 10,
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

const CONTENT_DATA = [
	// UTBK - Kemampuan Penalaran Umum (PU)
	{
		subjectId: 1,
		title: "Pengantar Penalaran Deduktif",
		order: 1,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Penalaran Deduktif" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Penalaran deduktif adalah proses penalaran yang bergerak dari pernyataan umum ke pernyataan khusus. Metode ini sering disebut sebagai pendekatan top-down.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Ciri-ciri Penalaran Deduktif" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Dimulai dari prinsip atau hukum umum" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Menuju kesimpulan yang lebih spesifik" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Menggunakan silogisme sebagai dasar penalaran" }],
								},
							],
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Contoh Penalaran Deduktif" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Semua manusia akan mati (premis mayor). Socrates adalah manusia (premis minor). Therefore, Socrates akan mati (kesimpulan).",
						},
					],
				},
			],
		},
	},
	{
		subjectId: 1,
		title: "Penalaran Induktif",
		order: 2,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Penalaran Induktif" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Penalaran induktif adalah proses penalaran yang bergerak dari pernyataan khusus ke pernyataan umum. Metode ini sering disebut sebagai pendekatan bottom-up.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Ciri-ciri Penalaran Induktif" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Dimulai dari fakta-fakta khusus" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Menuju kesimpulan yang bersifat umum" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Kesimpulan bersifat probabilistik (tidak pasti)" }],
								},
							],
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Contoh Penalaran Induktif" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Burung elang terbang, burung pipit terbang, burung gagak terbang. Therefore, semua burung dapat terbang (kesimpulan yang tidak selalu benar).",
						},
					],
				},
			],
		},
	},
	{
		subjectId: 1,
		title: "Logika dan Himpunan",
		order: 3,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Logika dan Himpunan" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Himpunan adalah kumpulan objek yang memiliki definisi yang jelas. Dalam penalaran, himpunan digunakan untuk mengklasifikasikan dan mengorganisir informasi.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Operasi Himpunan" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Irisan (∩): Elemen yang dimiliki kedua himpunan" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Gabungan (∪): Elemen yang dimiliki minimal satu himpunan" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Komplemen (A^c): Elemen yang tidak dimiliki himpunan" }],
								},
							],
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Penerapan dalam Penalaran" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Konsep himpunan sering digunakan dalam soal penalaran untuk menguji kemampuan logika dan kemampuan membedakan kategori.",
						},
					],
				},
			],
		},
	},
	{
		subjectId: 1,
		title: "Pola Bilangan dan Deret",
		order: 4,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Pola Bilangan dan Deret" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Pola bilangan adalah susunan bilangan yang mengikuti aturan tertentu. Deret adalah penjumlahan dari urutan bilangan.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Jenis-jenis Pola Bilangan" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Pola bilangan ganjil: 1, 3, 5, 7, 9, ..." }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Pola bilangan genap: 2, 4, 6, 8, 10, ..." }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Pola bilangan segitiga: 1, 3, 6, 10, 15, ..." }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Pola bilangan kuadrat: 1, 4, 9, 16, 25, ..." }],
								},
							],
						},
					],
				},
			],
		},
	},
	{
		subjectId: 1,
		title: "Analogi Verbal",
		order: 5,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Analogi Verbal" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Analogi verbal adalah hubungan kemiripan antara dua pasang kata yang memiliki pola atau relasi yang sama.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Jenis-jenis Relasi" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Sinonim: Kata yang memiliki makna sama" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Antonim: Kata yang memiliki makna berlawanan" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Bagian-keseluruhan: Hubungan bagian dengan keseluruhan" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Sebab-akibat: Hubungan kausal antara dua hal" }],
								},
							],
						},
					],
				},
			],
		},
	},
	// UTBK - Pengetahuan Kuantitatif (PK)
	{
		subjectId: 4,
		title: "Aritmatika Dasar",
		order: 1,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Aritmatika Dasar" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Aritmatika mencakup operasi dasar matematika: penjumlahan, pengurangan, perkalian, dan pembagian.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Sifat-sifat Operasi" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Komutatif: a + b = b + a" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Asosiatif: (a + b) + c = a + (b + c)" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Distributif: a × (b + c) = (a × b) + (a × c)" }],
								},
							],
						},
					],
				},
			],
		},
	},
	{
		subjectId: 4,
		title: "Perbandingan dan Proporsi",
		order: 2,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Perbandingan dan Proporsi" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Perbandingan adalah hubungan antara dua atau lebih kuantitas. Proporsi adalah pernyataan bahwa dua perbandingan adalah sama.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Jenis Perbandingan" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Perbandingan senilai: Jika x naik, y naik" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Perbandingan berbalik nilai: Jika x naik, y turun" }],
								},
							],
						},
					],
				},
			],
		},
	},
	{
		subjectId: 4,
		title: "Statistika Dasar",
		order: 3,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Statistika Dasar" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Statistika adalah ilmu yang mempelajari pengumpulan, pengolahan, analisis, dan interpretasi data.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Ukuran Pemusatan Data" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Mean (rata-rata): Jumlah data dibagi banyaknya data" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Median: Nilai tengah setelah data diurutkan" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Modus: Nilai yang paling sering muncul" }],
								},
							],
						},
					],
				},
			],
		},
	},
	// SD - Matematika SD
	{
		subjectId: 8,
		title: "Operasi Hitung Bilangan Bulat",
		order: 1,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Operasi Hitung Bilangan Bulat" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Bilangan bulat terdiri dari bilangan positif, negatif, dan nol. Kita dapat melakukan berbagai operasi hitung dengan bilangan bulat.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Aturan Penjumlahan dan Pengurangan" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Positif + Positif = Positif" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Negatif + Negatif = Negatif" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Positif + Negatif = Selisih (tanda mengikuti yang lebih besar)" }],
								},
							],
						},
					],
				},
			],
		},
	},
	{
		subjectId: 8,
		title: "Pecahan dan Desimal",
		order: 2,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Pecahan dan Desimal" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Pecahan adalah bilangan yang menunjukkan bagian dari keseluruhan. Desimal adalah cara lain untuk menuliskan pecahan.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Jenis-jenis Pecahan" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Pecahan biasa: pembilang < penyebut" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Pecahan campuran: bilangan bulat + pecahan" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Pecahan desimal: ditulis dengan koma" }],
								},
							],
						},
					],
				},
			],
		},
	},
	{
		subjectId: 8,
		title: "Geometri Bangun Datar",
		order: 3,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Geometri Bangun Datar" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Bangun datar adalah bangun dua dimensi yang memiliki panjang dan lebar.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Macam-macam Bangun Datar" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Persegi: 4 sisi sama panjang, 4 sudut siku-siku" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Persegi panjang: sisi berhadapan sama panjang, 4 sudut siku-siku" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Segitiga: 3 sisi, 3 sudut" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Lingkaran: kurva tertutup dengan jarak sama ke titik pusat" }],
								},
							],
						},
					],
				},
			],
		},
	},
	// SMP - Matematika SMP
	{
		subjectId: 15,
		title: "Aljabar dan Persamaan Linear",
		order: 1,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Aljabar dan Persamaan Linear" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Aljabar adalah cabang matematika yang menggunakan huruf untuk mewakili bilangan. Persamaan linear adalah persamaan dengan pangkat tertinggi 1.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Bentuk Umum Persamaan Linear" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Persamaan linear satu variabel: ax + b = 0",
						},
					],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Persamaan linear dua variabel: ax + by = c",
						},
					],
				},
			],
		},
	},
	{
		subjectId: 15,
		title: "Pythagoras dan Teorema Pythagoras",
		order: 2,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Teorema Pythagoras" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Teorema Pythagoras menyatakan bahwa pada segitiga siku-siku, kuadrat sisi miring sama dengan jumlah kuadrat kedua sisi lainnya.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Rumus Pythagoras" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "c² = a² + b²",
						},
					],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Di mana c adalah sisi miring (hipotenusa), a dan b adalah sisi-sisi lainnya.",
						},
					],
				},
			],
		},
	},
	// SMA - Matematika SMA
	{
		subjectId: 22,
		title: "Fungsi dan Grafik",
		order: 1,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Fungsi dan Grafik" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Fungsi adalah relasi yang memetakan setiap anggota domain ke tepat satu anggota kodomain.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Jenis-jenis Fungsi" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Fungsi linear: f(x) = ax + b" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Fungsi kuadrat: f(x) = ax² + bx + c" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Fungsi eksponen: f(x) = aˣ" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Fungsi logaritma: f(x) = ᵃlog x" }],
								},
							],
						},
					],
				},
			],
		},
	},
	{
		subjectId: 22,
		title: "Trigonometri",
		order: 2,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Trigonometri" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Trigonometri adalah cabang matematika yang mempelajari hubungan antara sudut dan sisi dalam segitiga.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Perbandingan Trigonometri" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "sin α = depan / miring" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "cos α = samping / miring" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "tan α = depan / samping" }],
								},
							],
						},
					],
				},
			],
		},
	},
	{
		subjectId: 22,
		title: "Limit Fungsi",
		order: 3,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Limit Fungsi" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Limit adalah nilai yang didekati suatu fungsi ketika variabelnya mendekati suatu nilai tertentu.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Sifat-sifat Limit" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Limit jumlah = jumlah limit" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Limit selisih = selisih limit" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Limit kali = kali limit" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Limit bagi = bagi limit (penyebut ≠ 0)" }],
								},
							],
						},
					],
				},
			],
		},
	},
	// SMA - Fisika SMA
	{
		subjectId: 25,
		title: "Gerak Lurus",
		order: 1,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Gerak Lurus" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Gerak lurus adalah gerak benda pada lintasan garis lurus.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Jenis Gerak Lurus" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "GLB (Gerak Lurus Beraturan): kecepatan konstan" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "GLBB (Gerak Lurus Berubah Beraturan): percepatan konstan" }],
								},
							],
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Rumus-rumus Penting" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "v = s/t (kecepatan = jarak/waktu)",
						},
					],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "a = Δv/t (percepatan = perubahan kecepatan/waktu)",
						},
					],
				},
			],
		},
	},
	{
		subjectId: 25,
		title: "Hukum Newton",
		order: 2,
		videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		noteContent: {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 1 },
					content: [{ type: "text", text: "Hukum Newton" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Hukum Newton menjelaskan hubungan antara gaya, massa, dan percepatan benda.",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Tiga Hukum Newton" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [
										{
											type: "text",
											text: "Hukum I (Inersia): Benda diam tetap diam, benda bergerak tetap bergerak dengan kecepatan konstan jika tidak ada gaya luar",
										},
									],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Hukum II: F = m × a (gaya = massa × percepatan)" }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [
										{
											type: "text",
											text: "Hukum III (Aksi-Reaksi): Setiap aksi memiliki reaksi yang sama besar tetapi berlawanan arah",
										},
									],
								},
							],
						},
					],
				},
			],
		},
	},
];

export async function clearContent(db: NodePgDatabase) {
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
		await db.delete(contentPracticeQuestions);
	} catch {
		console.log("content_practice_questions table not found, skipping clear");
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
}

export async function seedContent(db: NodePgDatabase) {
	await db.transaction(async (tx) => {
		const insertedContents = await tx
			.insert(contentItem)
			.values(
				CONTENT_DATA.map((c) => ({
					subjectId: c.subjectId,
					title: c.title,
					order: c.order,
				})),
			)
			.returning({
				id: contentItem.id,
				subjectId: contentItem.subjectId,
				title: contentItem.title,
			});

		console.log(`Content: ${insertedContents.length} created`);

		for (const content of insertedContents) {
			const sourceContent = CONTENT_DATA.find((c) => c.title === content.title && c.subjectId === content.subjectId);
			if (!sourceContent) continue;

			await tx.insert(videoMaterial).values({
				contentItemId: content.id,
				videoUrl: sourceContent.videoUrl,
				content: {},
			});

			await tx.insert(noteMaterial).values({
				contentItemId: content.id,
				content: sourceContent.noteContent,
			});

			console.log(`  - ${content.title}: video + notes created`);
		}

		console.log("Content seed completed!");
	});
}
