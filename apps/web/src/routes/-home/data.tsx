import { InstagramLogoIcon, WhatsappLogoIcon, XLogoIcon } from "@phosphor-icons/react";

export const DATA = {
	testimone: [
		{
			id: 1,
			name: "Alumni Batch 2025",
			title: "STEI-R ITB",
			desc: "“bimbelbeta ga cuman bantu aku lolos PTN, tapi juga bantu ngebentuk habit yang bagus”",
		},
		{
			id: 2,
			name: "Alumni Batch 2025",
			title: "Manajemen UI",
			desc: "“Selama aku di bimbelbeta itu beda banget feelnya sama bimbel lain, karena di sini kita ga cuman ngejar PTN aja tapi juga jadi punya mindset jangka panjang!”",
		},
		{
			id: 3,
			name: "Alumni Batch 2025",
			title: "Ilmu Komunikasi UI",
			desc: "“Keren si bimbelbeta baru 2 tahun berdiri tapi udah bisa bantu ribuan orang lolos PTN, thanks bimbelbeta <3”",
		},
		{
			id: 4,
			name: "Alumni Batch 2025",
			title: "Kedokteran UGM",
			desc: "“Berkat bimbelbeta aku bisa tembus skor LBE 800+! makasih bangetttt kak firah dan bimbelbeta!! WORTH IT PARAH”",
		},
		{
			id: 5,
			name: "Alumni Batch 2025",
			title: "Hukum UI",
			desc: "“Masuk bimbelbeta adalah keputusan terbaik selama persiapan PTN. Sistemnya benar-benar melatih disiplin dan konsistensi belajar!”",
		},
		{
			id: 6,
			name: "Alumni Batch 2025",
			title: "Hukum UGM",
			desc: "“Ga nyangka bisa lolos PTN dengan skor di atas 700. Thanks bimbelbeta yang udah bantu aku membentuk mindset belajar!”",
		},
		{
			id: 7,
			name: "Alumni Batch 2025",
			title: "Sastra UNSOED",
			desc: "“Yang bikin beda dari bimbelbeta adalah pendekatan holistiknya. Bukan cuman soal, tapi juga habit dan mental yang dibina.”",
		},
		{
			id: 8,
			name: "Alumni Batch 2025",
			title: "Teknik UPNVY",
			desc: "“Dari yang awalnya males belajar, akhirnya jadi punya rutinitas yang konsisten. Hasilnya? Aku lolos PTN incaran!”",
		},
	],
	pricing: {
		plans: {
			classroom: {
				label: "Classroom",
				price_monthly: "Rp50.000",
				price_full: "Rp99.000",
				suffix: "s.d UTBK",
				features: [
					{ label: "Akses Full Website", status: "excluded" },
					{ label: "Google Classroom", status: "included" },
					{ label: "Tugas Harian & Kuis", status: "included" },
					{ label: "1000+ Latihan Soal", status: "included" },
					{ label: "Habit Tracker & Grup", status: "included" },
					{ label: "Matrikulasi Subtest", status: "included" },
					{ label: "Live Class (3x/Minggu)", status: "excluded" },
					{ label: "Mentor UI, ITB, UGM", status: "excluded" },
					{ label: "Try Out & Pembahasan", status: "limited", value: "3x" },
				],
				cta: {
					label: "Mulai Sekarang",
					url: "http://lynk.id/bimbelbeta/64p096g69747",
				},
			},

			mentoring_perintis: {
				label: "Mentoring Perintis",
				price_monthly: "Rp99.000",
				price_full: "Rp179.000",
				suffix: "s.d UTBK",
				features: [
					{ label: "Akses Full Website", status: "excluded" },
					{ label: "Google Classroom", status: "excluded" },
					{ label: "Tugas Harian & Kuis", status: "excluded" },
					{ label: "1000+ Latihan Soal", status: "excluded" },
					{ label: "Habit Tracker & Grup", status: "excluded" },
					{ label: "Matrikulasi Subtest", status: "excluded" },
					{ label: "Live Class (3x/Minggu)", status: "included" },
					{ label: "Mentor UI, ITB, UGM", status: "included" },
					{ label: "Try Out & Pembahasan", status: "excluded" },
				],
				cta: {
					label: "Mulai Sekarang",
					url: "http://lynk.id/bimbelbeta/z19qjzqr0ln9",
				},
			},

			mentoring_privilege: {
				label: "Mentoring Privilege",
				price_full: "Rp225.000",
				suffix: "s.d UTBK",
				features: [
					{ label: "Akses Full Website", status: "excluded" },
					{ label: "Google Classroom", status: "included" },
					{ label: "Tugas Harian & Kuis", status: "included" },
					{ label: "1000+ Latihan Soal", status: "included" },
					{ label: "Habit Tracker & Grup", status: "included" },
					{ label: "Matrikulasi Subtest", status: "included" },
					{ label: "Live Class (3x/Minggu)", status: "included" },
					{ label: "Mentor UI, ITB, UGM", status: "included" },
					{ label: "Try Out & Pembahasan", status: "limited", value: "3x" },
				],
				cta: {
					label: "Mulai Sekarang",
					url: "http://lynk.id/bimbelbeta/y2rjxkq02d13",
				},
			},

			ultimate_bundling: {
				label: "Ultimate Bundling",
				badge: "Paling Lengkap",
				price_now: "Rp199.000",
				original_price: "Rp1.000.000",
				suffix: "s.d UTBK",
				features: [
					{ label: "Akses Full Website", status: "included" },
					{ label: "1000+ Soal Dasar SNBT", status: "included" },
					{ label: "250+ Video Materi", status: "included" },
					{ label: "1000+ Latihan Soal", status: "included" },
					{ label: "Habit Tracker & Grup", status: "included" },
					{ label: "Matrikulasi Subtest", status: "included" },
					{ label: "Live Class (3x/Minggu)", status: "included" },
					{ label: "Mentor UI, ITB, UGM", status: "included" },
					{ label: "Try Out & Pembahasan", status: "limited", value: "15x" },
				],
				cta: {
					label: "Langganan Sekarang",
					url: "/premium",
				},
			},
		},
	},
	pricing_tryout: {
		one: {
			label: "1x Try Out UTBK bimbelbeta",
			price: "Rp15.000",
			features: ["Try Out SNBT-UTBK 1 Kali", "Pembahasan & Analisis", "Penilaian IRT", "Dapat dilakukan kapan saja"],
			cta: {
				label: "Mulai Sekarang",
				url: "http://lynk.id/bimbelbeta/y2rjxkq02d13",
			},
		},
		two: {
			label: "10x Try Out UTBK bimbelbeta",
			price: "Rp99.000",
			features: ["Try Out SNBT-UTBK 10 Kali", "Pembahasan & Analisis", "Penilaian IRT", "Dapat dilakukan kapan saja"],
			cta: {
				label: "Mulai Sekarang",
				url: "http://lynk.id/bimbelbeta/dzon2p8qgx9n",
			},
		},
		three: {
			label: "15x Try Out UTBK bimbelbeta",
			price: "Rp120.000",
			features: ["Try Out SNBT-UTBK 15 Kali", "Pembahasan & Analisis", "Penilaian IRT", "Dapat dilakukan kapan saja"],
			cta: {
				label: "Mulai Sekarang",
				url: "http://lynk.id/bimbelbeta/xw1ov34dg98g",
			},
		},
	},
	footer: {
		socials: [
			{
				label: "Instagram",
				icon: InstagramLogoIcon,
				url: "https://www.instagram.com/bimbelbeta.id",
			},
			{
				label: "X",
				icon: XLogoIcon,
				url: "https://x.com/bimbelbeta",
			},
			{
				label: "WhatsApp",
				icon: WhatsappLogoIcon,
				url: "https://wa.me/6283854264330",
			},
			// {
			// 	label: "Discord",
			// 	icon: DiscordLogoIcon,
			// 	url: "https://discord.gg/bimbelbeta",
			// },
			// {
			// 	label: "TikTok",
			// 	icon: TiktokLogoIcon,
			// 	url: "https://www.tiktok.com/@bimbelbeta",
			// },
			// {
			// 	label: "YouTube",
			// 	icon: YoutubeLogoIcon,
			// 	url: "https://www.youtube.com/@bimbelbeta",
			// },
		],
	},
	faq: [
		{
			id: 1,
			question: "Apa perbedaan bimbelbeta dengan bimbel lain?",
			answer:
				"bimbelbeta berbeda karena kami tidak hanya fokus pada materi akademik, tetapi juga membentuk habit belajar dan mindset jangka panjang. Sistem kami dirancang untuk membangun disiplin dan konsistensi belajar yang berkelanjutan.",
		},
		{
			id: 2,
			question: "Bagaimana cara bergabung dengan bimbelbeta?",
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
			question: "Berapa lama durasi program bimbelbeta?",
			answer:
				"Program bimbelbeta berlangsung hingga pelaksanaan UTBK. Anda memiliki akses penuh ke materi, kelas live, dan latihan soal selama periode tersebut dengan dukungan mentor dari UI, ITB, dan UGM.",
		},
		{
			id: 5,
			question: "Apakah materi bisa diakses kapan saja?",
			answer:
				"Untuk paket Ultimate Bundling, Anda memiliki akses full website 24/7. Paket lain memiliki keterbatasan akses tertentu. Live class diadakan 3 kali per minggu dengan jadwal yang terstruktur.",
		},
		{
			id: 6,
			question: "Bagaimana sistem mentoring di bimbelbeta?",
			answer:
				"Sistem mentoring kami dibimbing langsung oleh mentor dari UI, ITB, dan UGM. Anda akan mendapatkan bimbingan intensif, pemantauan progress belajar, dan habit tracker untuk memastikan konsistensi belajar.",
		},
	],
} as const;
