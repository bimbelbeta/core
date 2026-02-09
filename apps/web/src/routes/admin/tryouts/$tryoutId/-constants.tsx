export const CATEGORY_LABELS: Record<string, string> = {
	sd: "SD",
	smp: "SMP",
	sma: "SMA",
	utbk: "UTBK",
};

export const STATUS_CONFIG: Record<
	string,
	{ label: string; variant: "default" | "secondary" | "outline" | "destructive"; showRocketIcon: boolean }
> = {
	draft: { label: "Draft", variant: "secondary", showRocketIcon: false },
	published: { label: "Published", variant: "default", showRocketIcon: true },
	archived: { label: "Archived", variant: "outline", showRocketIcon: false },
};
