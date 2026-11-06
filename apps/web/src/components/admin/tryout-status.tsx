import { AdminStatus } from "@/components/admin/admin-status";

const statuses = {
	draft: { label: "Draf", tone: "warning" },
	published: { label: "Terbit", tone: "positive" },
	archived: { label: "Arsip", tone: "neutral" },
} as const;

export function TryoutStatus({ status }: { status: keyof typeof statuses }) {
	const { label, tone } = statuses[status];

	return <AdminStatus tone={tone}>{label}</AdminStatus>;
}
