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
			name: "Rizky Aditya Pratama",
			title: "Ilmu Hukum – Universitas Indonesia",
			desc: "“Bimbel Beta ga cuman bantu aku lolos PTN, tapi juga bantu ngebentuk habit yang bagus”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Rizky",
		},
		{
			id: 2,
			name: "Nabila Azzahra Putri",
			title: "Manajemen – Universitas Indonesia",
			desc: "“Selama aku di Bimbel Beta itu beda banget feelnya sama bimbel lain, karena di sini kita ga cuman ngejar PTN aja tapi juga jadi punya mindset jangka panjang!”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Nabila",
		},
		{
			id: 3,
			name: "Muhammad Farhan Alamsyah",
			title: "Ilmu Komunikasi – Universitas Indonesia",
			desc: "“Keren si Bimbel Beta baru 2 tahun berdiri tapi udah bisa bantu ribuan orang lolos PTN, thanks Bimbel Beta <3”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Farhan",
		},
		{
			id: 4,
			name: "Aulia Rahmawati",
			title: "Pendidikan Dokter – Universitas Gadjah Mada",
			desc: "“Berkat Bimbel Beta aku bisa tembus skor LBE 800+! makasih bangetttt kak firah dan Bimbel Beta!! WORTH IT PARAH”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Aulia",
		},
		{
			id: 5,
			name: "Dimas Arya Nugroho",
			title: "Ilmu Hukum – Universitas Indonesia",
			desc: "“Masuk Bimbel Beta adalah keputusan terbaik selama persiapan PTN. Sistemnya benar-benar melatih disiplin dan konsistensi belajar!”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Dimas",
		},
		{
			id: 6,
			name: "Ahmad Zaky Ramadhan",
			title: "Ilmu Hukum – Universitas Gadjah Mada",
			desc: "“Ga nyangka bisa lolos PTN dengan skor di atas 700. Thanks Bimbel Beta yang udah bantu aku membentuk mindset belajar!”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Zaky",
		},
		{
			id: 7,
			name: "Intan Maharani Lestari",
			title: "Sastra Indonesia – Universitas Jenderal Soedirman",
			desc: "“Yang bikin beda dari Bimbel Beta adalah pendekatan holistiknya. Bukan cuman soal, tapi juga mental yang dibina.”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Intan",
		},
		{
			id: 8,
			name: "Fajar Prakoso",
			title: "Teknik – Universitas Pembangunan Nasional Veteran Yogyakarta",
			desc: "“Dari yang awalnya males belajar, akhirnya jadi punya rutinitas yang konsisten. Hasilnya? Aku lolos PTN incaran!”",
			avatar: "https://api.dicebear.com/9.x/adventurer/svg?seed=Fajar",
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
