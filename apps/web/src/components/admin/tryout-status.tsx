import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statuses = {
	draft: { label: "Draf", className: "border-yellow-300/70 bg-yellow-100/60 text-yellow-800" },
	published: { label: "Terbit", className: "border-green-200 bg-green-100/60 text-green-800" },
	archived: { label: "Arsip", className: "border-border bg-muted text-muted-foreground" },
};

export function TryoutStatus({ status }: { status: keyof typeof statuses }) {
	return (
		<Badge variant="outline" className={cn("h-6 px-2.5 py-0 text-xs font-normal", statuses[status].className)}>
			{statuses[status].label}
		</Badge>
	);
}
