export const typographyVariants = {
	hero: {
		element: "h1",
		className: "text-2xl leading-tight font-semibold min-[400px]:text-3xl sm:text-4xl xl:text-5xl",
		tone: "default",
	},
	display: { element: "h1", className: "text-3xl leading-tight font-semibold sm:text-4xl", tone: "default" },
	title: { element: "h1", className: "text-page-title", tone: "default" },
	subtitle1: { element: "h2", className: "text-lg font-semibold", tone: "default" },
	subtitle2: { element: "h3", className: "text-base font-semibold", tone: "default" },
	body: { element: "p", className: "text-sm", tone: "default" },
	caption: { element: "p", className: "text-xs", tone: "muted" },
	overline: { element: "p", className: "text-xs font-semibold tracking-wide uppercase", tone: "default" },
} as const;

export type TypographyVariant = keyof typeof typographyVariants;

export const typographyTones = {
	default: "",
	muted: "text-muted-foreground",
	destructive: "text-red-200",
	accent: "text-primary-800",
} as const;

export type TypographyTone = keyof typeof typographyTones;
