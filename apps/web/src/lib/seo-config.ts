export const siteConfig = {
	name: "BimbelBeta",
	description:
		"Platform persiapan SNBT/UTBK terbaik dengan materi lengkap, latihan soal interaktif, dan analisis progres belajar.",
	url: "https://bimbelbeta.com",
	ogImage: "/og-image.png",
	keywords: [
		"SNBT",
		"UTBK",
		"bimbel online",
		"persiapan UTBK",
		"latihan soal UTBK",
		"tryout SNBT",
		"belajar UTBK",
		"materi SNBT",
		"TPS",
		"TKA",
		"literasi",
		"pengetahuan kuantitatif",
	],
	creator: "@bimbelbeta",
	twitterCreator: "@bimbelbeta",
	locale: "id_ID",
	type: "website",
} as const;

export type SiteConfig = typeof siteConfig;
