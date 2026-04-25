import { InstagramLogoIcon, WhatsappLogoIcon } from "@phosphor-icons/react";

export const DATA = {
	stats: [
		{
			id: 1,
			value: "85%",
			desc: "Murid Bimbel Beta lolos PTN Impian",
		},
		{
			id: 2,
			value: "+120 Poin",
			desc: "Rata-rata kenaikan skor tryout",
		},
		{
			id: 3,
			value: "15.000+",
			desc: "Latihan soal telah dikerjakan",
		},
	],
	testimone: [
		{
			id: 1,
			name: "M. Ihsan Musyaffa",
			title: "Fak. Pertanian UGM",
			desc: "Bimbel Beta hadir dengan tentor tentor yang sangat humble, asik, dan seru dan mereka ngasih motivasi kalo aku pasti bisa lolos UTBK. Try out Bimbel Beta juga sangat prediktif sampe akhirnya aku bisa lolos masuk UGM. Bimbel Beta is the best",
			avatar: "/images/testimonials/ugm.jpeg",
		},
		{
			id: 2,
			name: "Alia Keisha Fawzia",
			title: "Aktuaria FMIPA UI",
			desc: "UTBK Preparation di Bimbel Beta itu next level banget karena materinya mateng dan tiap hari selalu dihajar latihan soal plus dapet buku kumpulan soal juga! Serunya lagi, kita dikasih tahu insight Tips and Trik LOLOS PTN",
			avatar: "/images/testimonials/ui.jpeg",
		},
		{
			id: 3,
			name: "Hubayba Mayang Mahamida",
			title: "Ekonomi Pembangunan UPN Veteran Yogyakarta",
			desc: "Bimbel Beta sangat membantu saya dalam mempersiapkan UTBK dengan lebih terarah. Materi yang diberikan jelas, pembahasannya mudah dipahami, dan latihan soalnya cukup bervariasi sehingga membuat saya lebih terbiasa untuk menghadapi tipe-tipe soal UTBK. Tentornya juga membimbing dengan sabar dan sering kasih motivasi, jadi proses belajarnya kerasa lebih nyaman. Pengalaman belajar di Bimbel Beta membuat saya lebih percaya diri saat menghadapi UTBK.",
			avatar: "/images/testimonials/upn.jpeg",
		},
		{
			id: 4,
			name: "",
			title: "UNY",
			desc: "Selama persiapan UTBK di Bimbel Beta, aku ngerasa progress belajarku lebih terarah. Penjelasannya gampang dipahami, dan tiap bulan ada evaluasi yang bikin aku tahu kekuranganku di mana. Jadi, bener-bener membantu",
			avatar: "/images/testimonials/uny.jpeg",
		},
	],
	pricing: {
		programs: [
			{
				id: "pemula",
				type: "program",
				variant: "highlight",
				title: "Paket Pemula",
				price: 1800000,
				originalPrice: 2000000,
				period: "s.d 31 Mei",
				features: [
					"Live Teaching 7 Sub Tes UTBK setiap pekannya",
					"Akses Penuh fasilitas Ruang Belajar",
					"Try Out UTBK 10x",
					// "Rasionalisasi SNBP & SNBT",
					"Rekaman Live Teaching",
					"Modul Digital dan Latihan Soal Tambahan",
				],
			},
			{
				id: "perbulan",
				type: "program",
				variant: "default",
				title: "Paket Perbulan",
				price: 170000,
				period: "/bulan",
				features: [
					"Live Teaching 7 Sub Tes UTBK setiap pekannya",
					"Akses Penuh fasilitas Ruang Belajar",
					"Try Out UTBK 10x",
					// "Rasionalisasi SNBP & SNBT",
					"Rekaman Live Teaching",
					"Modul Digital dan Latihan Soal Tambahan",
				],
			},
		],

		tryouts: [
			{
				id: "to-1",
				type: "tryout",
				title: "Paket Try Out 1x",
				price: 10000,
				features: [
					"Try Out UTBK 1x",
					// "Rasionalisasi SNBT",
					"Pembahasan & Analisis",
				],
			},
			{
				id: "to-3",
				type: "tryout",
				title: "Paket Try Out 3x",
				price: 25000,
				features: [
					"Try Out UTBK 3x",
					// "Rasionalisasi SNBT",
					"Pembahasan & Analisis",
				],
			},
			{
				id: "to-5",
				type: "tryout",
				title: "Paket Try Out 5x",
				price: 40000,
				features: [
					"Try Out UTBK 5x",
					// "Rasionalisasi SNBT",
					"Pembahasan & Analisis",
				],
			},
			{
				id: "to-10",
				type: "tryout",
				title: "Paket Try Out 10x",
				price: 80000,
				features: [
					"Try Out UTBK 10x",
					// "Rasionalisasi SNBT",
					"Pembahasan & Analisis",
				],
			},
		],
	},

	footer: {
		socials: [
			{
				label: "Instagram",
				icon: InstagramLogoIcon,
				url: "https://www.instagram.com/bimbelbeta1",
			},
			{
				label: "WhatsApp",
				icon: WhatsappLogoIcon,
				url: "https://wa.me/6289655569019",
			},
		],
	},
	faq: [
		{
			id: 1,
			question: "Apa perbedaan Bimbel Beta dengan bimbel lain?",
			answer:
				"Bimbel Beta berbeda karena kami tidak hanya fokus pada materi akademik, tetapi juga membentuk habit belajar dan mindset jangka panjang. Sistem kami dirancang untuk membangun disiplin dan konsistensi belajar yang berkelanjutan.",
		},
		{
			id: 2,
			question: "Bagaimana cara bergabung dengan Bimbel Beta?",
			answer:
				"Anda bisa bergabung dengan memilih paket yang sesuai kebutuhan dan mengisi form pendaftaran melalui link yang tersedia. Setelah itu, Anda akan diarahkan ke grup belajar dan platform pembelajaran kami.",
		},
		{
			id: 3,
			question: "Apakah ada jaminan tembus PTN?",
			answer:
				"Kami tidak memberikan jaminan tembus PTN karena hasil akhir sangat bergantung pada usaha dan konsistensi masing-masing siswa. Namun, kami menjamin sistem dan materi terbaik untuk memaksimalkan peluang kesuksesan Anda.",
		},
		{
			id: 4,
			question: "Berapa lama durasi program Bimbel Beta?",
			answer:
				"Program Bimbel Beta berlangsung hingga pelaksanaan UTBK. Anda memiliki akses penuh ke materi, kelas live, dan latihan soal selama periode tersebut dengan dukungan mentor dari UI, ITB, dan UGM.",
		},
		{
			id: 5,
			question: "Apakah materi bisa diakses kapan saja?",
			answer:
				"Untuk paket Ultimate Bundling, Anda memiliki akses full website 24/7. Paket lain memiliki keterbatasan akses tertentu. Live class diadakan 3 kali per minggu dengan jadwal yang terstruktur.",
		},
		{
			id: 6,
			question: "Bagaimana sistem mentoring di Bimbel Beta?",
			answer:
				"Sistem mentoring kami dibimbing langsung oleh mentor berpengalaman dan asik lulusan UI, UGM, dll. Anda akan mendapatkan bimbingan intensif, pemantauan progress belajar, dan habit tracker untuk memastikan konsistensi belajar.",
		},
	],
} as const;
