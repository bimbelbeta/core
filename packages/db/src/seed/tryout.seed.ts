import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {

	question,
	questionChoice,
} from "../schema/question"
import {
	tryout,
	tryoutAttempt,
	tryoutSubtest,
	tryoutSubtestAttempt,
	tryoutSubtestQuestion,
	tryoutUserAnswer,
} from "../schema/tryout";

const TRYOUT_DATA = {
	title: "Tryout UTBK SNBT 2025",
	description: "Simulasi ujian tulis berbasis komputer untuk seleksi nasional berbasis tes",
};

const SUBTEST_DATA = [
	{ name: "Penalaran Umum", duration: 25, order: 1 },
	{ name: "Literasi Bahasa Indonesia", duration: 25, order: 2 },
	{ name: "Literasi Bahasa Inggris", duration: 20, order: 3 },
	{ name: "Penalaran Matematika", duration: 25, order: 4 },
];

const QUESTION_DATA = [
	{
		subtestName: "Penalaran Umum",
		questions: [
			{
				content: "Semua mahasiswa memiliki kartu mahasiswa. Ali adalah mahasiswa.",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Ali memiliki kartu mahasiswa", isCorrect: true },
					{ code: "B", content: "Ali tidak memiliki kartu mahasiswa", isCorrect: false },
					{ code: "C", content: "Kartu mahasiswa Ali hilang", isCorrect: false },
					{ code: "D", content: "Ali bukan mahasiswa", isCorrect: false },
				],
			},
			{
				content: "Jika hujan, maka jalan basah. Jalan tidak basah.",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Hujan", isCorrect: false },
					{ code: "B", content: "Tidak hujan", isCorrect: true },
					{ code: "C", content: "Jalan basah", isCorrect: false },
					{ code: "D", content: "Tidak ada kesimpulan", isCorrect: false },
				],
			},
			{
				content: "Segitiga memiliki 3 sisi. Bangun X memiliki 3 sisi.",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "X adalah segitiga", isCorrect: true },
					{ code: "B", content: "X bukan segitiga", isCorrect: false },
					{ code: "C", content: "X memiliki 4 sisi", isCorrect: false },
					{ code: "D", content: "Tidak dapat ditentukan", isCorrect: false },
				],
			},
			{
				content: "Beberapa burung bisa terbang. Penguin adalah burung.",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Penguin bisa terbang", isCorrect: false },
					{ code: "B", content: "Penguin tidak bisa terbang", isCorrect: false },
					{ code: "C", content: "Tidak dapat ditentukan", isCorrect: true },
					{ code: "D", content: "Semua burung bisa terbang", isCorrect: false },
				],
			},
			{
				content: "Jika x > 5 dan y < 3, maka...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "x > y", isCorrect: false },
					{ code: "B", content: "y < x", isCorrect: true },
					{ code: "C", content: "x < y", isCorrect: false },
					{ code: "D", content: "x = y", isCorrect: false },
				],
			},
		],
	},
	{
		subtestName: "Literasi Bahasa Indonesia",
		questions: [
			{
				content:
					"Bacalah paragraf berikut: 'Indonesia merupakan negara kepulauan terbesar di dunia. Dengan lebih dari 17.000 pulau, Indonesia memiliki kekayaan alam yang melimpah.' Ide utama paragraf tersebut adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Jumlah pulau Indonesia", isCorrect: false },
					{ code: "B", content: "Kekayaan alam Indonesia", isCorrect: false },
					{ code: "C", content: "Indonesia sebagai negara kepulauan", isCorrect: true },
					{ code: "D", content: "Keunikan geografis Indonesia", isCorrect: false },
				],
			},
			{
				content: "Kata 'mengembangkan' dalam kalimat 'Pemerintah mengembangkan program pendidikan' memiliki makna...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Membesarkan", isCorrect: false },
					{ code: "B", content: "Menambah atau memperluas", isCorrect: true },
					{ code: "C", content: "Menciptakan", isCorrect: false },
					{ code: "D", content: "Mengatur", isCorrect: false },
				],
			},
			{
				content: "Penulisan kata yang benar adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Auto biography", isCorrect: false },
					{ code: "B", content: "Autobiografi", isCorrect: true },
					{ code: "C", content: "Oto biografi", isCorrect: false },
					{ code: "D", content: "Otto biografi", isCorrect: false },
				],
			},
			{
				content: "Kalimat yang efektif adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Karena hujan turun dengan lebat, maka saya tidak jadi keluar.", isCorrect: false },
					{ code: "B", content: "Saya tidak jadi keluar karena hujan turun dengan lebat.", isCorrect: true },
					{ code: "C", content: "Hujan turun dengan lebat, akibatnya saya tidak jadi keluar.", isCorrect: false },
					{ code: "D", content: "Saya tidak jadi keluar, karena hujan turun dengan lebat.", isCorrect: false },
				],
			},
			{
				content: "Sinonim dari kata 'optimal' adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Maksimal", isCorrect: true },
					{ code: "B", content: "Minimal", isCorrect: false },
					{ code: "C", content: "Normal", isCorrect: false },
					{ code: "D", content: "Standar", isCorrect: false },
				],
			},
		],
	},
	{
		subtestName: "Literasi Bahasa Inggris",
		questions: [
			{
				content: "The text is mainly about...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "The author's childhood", isCorrect: false },
					{ code: "B", content: "The importance of reading", isCorrect: true },
					{ code: "C", content: "Different types of books", isCorrect: false },
					{ code: "D", content: "How to write a story", isCorrect: false },
				],
			},
			{
				content: "The word 'significant' in paragraph 2 is closest in meaning to...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Unimportant", isCorrect: false },
					{ code: "B", content: "Important", isCorrect: true },
					{ code: "C", content: "Strange", isCorrect: false },
					{ code: "D", content: "Simple", isCorrect: false },
				],
			},
			{
				content: "According to the passage, what should students do to improve their vocabulary?",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Watch more television", isCorrect: false },
					{ code: "B", content: "Read extensively", isCorrect: true },
					{ code: "C", content: "Memorize word lists", isCorrect: false },
					{ code: "D", content: "Travel abroad", isCorrect: false },
				],
			},
			{
				content: "The main purpose of the passage is to...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Entertain readers", isCorrect: false },
					{ code: "B", content: "Persuade students to study harder", isCorrect: false },
					{ code: "C", content: "Inform readers about a topic", isCorrect: true },
					{ code: "D", content: "Describe a personal experience", isCorrect: false },
				],
			},
			{
				content: "Which of the following statements is NOT true according to the text?",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "Reading improves language skills", isCorrect: false },
					{ code: "B", content: "Students should read every day", isCorrect: false },
					{ code: "C", content: "Reading is only for school assignments", isCorrect: true },
					{ code: "D", content: "Varied reading materials are beneficial", isCorrect: false },
				],
			},
		],
	},
	{
		subtestName: "Penalaran Matematika",
		questions: [
			{
				content: "Jika 2x + 5 = 15, maka nilai x adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "3", isCorrect: false },
					{ code: "B", content: "4", isCorrect: false },
					{ code: "C", content: "5", isCorrect: true },
					{ code: "D", content: "6", isCorrect: false },
				],
			},
			{
				content: "Sebuah persegipanjang memiliki panjang 10 cm dan lebar 5 cm. Luasnya adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "30 cm²", isCorrect: false },
					{ code: "B", content: "40 cm²", isCorrect: false },
					{ code: "C", content: "50 cm²", isCorrect: true },
					{ code: "D", content: "60 cm²", isCorrect: false },
				],
			},
			{
				content: "Nilai dari 2³ + 2² adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "8", isCorrect: false },
					{ code: "B", content: "10", isCorrect: false },
					{ code: "C", content: "12", isCorrect: true },
					{ code: "D", content: "16", isCorrect: false },
				],
			},
			{
				content: "Jika 3x = 27, maka x² adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "36", isCorrect: false },
					{ code: "B", content: "49", isCorrect: false },
					{ code: "C", content: "64", isCorrect: false },
					{ code: "D", content: "81", isCorrect: true },
				],
			},
			{
				content: "Median dari data: 2, 4, 4, 5, 7, 9 adalah...",
				type: "multiple_choice" as const,
				choices: [
					{ code: "A", content: "4", isCorrect: false },
					{ code: "B", content: "4.5", isCorrect: true },
					{ code: "C", content: "5", isCorrect: false },
					{ code: "D", content: "6", isCorrect: false },
				],
			},
		],
	},
];

export async function seedTryout(db: NodePgDatabase) {
	await db.transaction(async (tx) => {
		const tryoutResult = await tx.insert(tryout).values(TRYOUT_DATA).returning({ id: tryout.id });
		const tryoutRow = tryoutResult[0];
		if (!tryoutRow) throw new Error("Failed to create tryout");
		console.log(`Tryout created: ${tryoutRow.id}`);

		const insertedSubtests: { id: number; name: string }[] = [];
		for (const subtestData of SUBTEST_DATA) {
			const subtestResult = await tx
				.insert(tryoutSubtest)
				.values({
					tryoutId: tryoutRow.id,
					name: subtestData.name,
					duration: subtestData.duration,
					order: subtestData.order,
				})
				.returning({ id: tryoutSubtest.id, name: tryoutSubtest.name });
			const subtestRow = subtestResult[0];
			if (!subtestRow) throw new Error("Failed to create subtest");
			insertedSubtests.push(subtestRow);
			console.log(`  Subtest created: ${subtestRow.name} (${subtestData.duration} min)`);
		}

		for (const questionGroup of QUESTION_DATA) {
			const targetSubtest = insertedSubtests.find((s) => s.name === questionGroup.subtestName);
			if (!targetSubtest) continue;

			for (const questionData of questionGroup.questions) {
				const questionResult = await tx
					.insert(question)
					.values({
						type: questionData.type,
						content: questionData.content,
					})
					.returning({ id: question.id });
				const questionRow = questionResult[0];
				if (!questionRow) throw new Error("Failed to create question");

				await tx.insert(tryoutSubtestQuestion).values({
					subtestId: targetSubtest.id,
					questionId: questionRow.id,
				});

				for (const choiceData of questionData.choices) {
					await tx.insert(questionChoice).values({
						questionId: questionRow.id,
						code: choiceData.code,
						content: choiceData.content,
						isCorrect: choiceData.isCorrect,
					});
				}
			}
			console.log(`  Questions created for ${questionGroup.subtestName}: ${questionGroup.questions.length}`);
		}

		console.log("Tryout seed completed");
	});
}

export async function clearTryout(db: NodePgDatabase) {
	try {
		await db.delete(tryoutUserAnswer);
	} catch {
		console.log("tryout_user_answer table not found, skipping clear");
	}

	try {
		await db.delete(tryoutSubtestQuestion);
	} catch {
		console.log("tryout_subtest_question table not found, skipping clear");
	}

	try {
		await db.delete(questionChoice);
	} catch {
		console.log("tryout_question_choice table not found, skipping clear");
	}

	try {
		await db.delete(question);
	} catch {
		console.log("tryout_question table not found, skipping clear");
	}

	try {
		await db.delete(tryoutSubtestAttempt);
	} catch {
		console.log("tryout_subtest_attempt table not found, skipping clear");
	}

	try {
		await db.delete(tryoutAttempt);
	} catch {
		console.log("tryout_attempt table not found, skipping clear");
	}

	try {
		await db.delete(tryoutSubtest);
	} catch {
		console.log("tryout_subtest table not found, skipping clear");
	}

	try {
		await db.delete(tryout);
	} catch {
		console.log("tryout table not found, skipping clear");
	}
}
