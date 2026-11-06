import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statuses = {
	draft: { label: "Draf", className: "border-amber-600/20 bg-amber-50 text-amber-700" },
	published: { label: "Terbit", className: "border-green-600/20 bg-green-50 text-green-700" },
	archived: { label: "Arsip", className: "border-border bg-muted text-muted-foreground" },
};

export function TryoutStatus({ status }: { status: keyof typeof statuses }) {
	return (
		<Badge variant="outline" className={cn("h-6 px-2.5 py-0 text-xs font-normal", statuses[status].className)}>
			{statuses[status].label}
		</Badge>
	);
}
