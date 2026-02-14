import { CalendarIcon, ClockIcon, CreditCardIcon } from "@phosphor-icons/react";

export const variantConfig = {
	fixed_date: {
		label: "Fixed Date",
		icon: CalendarIcon,
		iconColor: "text-purple-500",
		bgColor: "bg-purple-100",
	},
	monthly: {
		label: "Monthly",
		icon: ClockIcon,
		iconColor: "text-blue-500",
		bgColor: "bg-blue-100",
	},
	credits: {
		label: "Credits",
		icon: CreditCardIcon,
		iconColor: "text-green-500",
		bgColor: "bg-green-100",
	},
} as const;

export function formatCurrency(value: string | number): string {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num);
}

export function formatRelativeDate(date: Date): string {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInSeconds = Math.floor(diffInMs / 1000);
	const diffInMinutes = Math.floor(diffInSeconds / 60);
	const diffInHours = Math.floor(diffInMinutes / 60);
	const diffInDays = Math.floor(diffInHours / 24);
	const diffInWeeks = Math.floor(diffInDays / 7);
	const diffInMonths = Math.floor(diffInDays / 30);
	const diffInYears = Math.floor(diffInDays / 365);

	if (diffInSeconds < 60) return "Baru saja";
	if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
	if (diffInHours < 24) return `${diffInHours} jam lalu`;
	if (diffInDays < 7) return `${diffInDays} hari lalu`;
	if (diffInWeeks < 4) return `${diffInWeeks} minggu lalu`;
	if (diffInMonths < 12) return `${diffInMonths} bulan lalu`;
	return `${diffInYears} tahun lalu`;
}

export const months = [
	{ value: 1, label: "Januari" },
	{ value: 2, label: "Februari" },
	{ value: 3, label: "Maret" },
	{ value: 4, label: "April" },
	{ value: 5, label: "Mei" },
	{ value: 6, label: "Juni" },
	{ value: 7, label: "Juli" },
	{ value: 8, label: "Agustus" },
	{ value: 9, label: "September" },
	{ value: 10, label: "Oktober" },
	{ value: 11, label: "November" },
	{ value: 12, label: "Desember" },
] as const;

export function getMonthLabel(month: number): string {
	return months.find((m) => m.value === month)?.label ?? "";
}
