import type * as React from "react";

import { cn } from "@/lib/utils";

const tableRowLinkClass =
	"hover:text-primary focus-visible:text-primary focus-visible:ring-ring/50 line-clamp-1 rounded-sm underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline focus-visible:ring-2";

interface TableRowStackProps {
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	className?: string;
}

function TableRowStack({ title, subtitle, className }: TableRowStackProps) {
	return (
		<div className={cn("min-w-0", className)}>
			<div className="text-row-title text-foreground">{title}</div>
			{subtitle && (
				<div className="text-muted-foreground text-meta mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
					{subtitle}
				</div>
			)}
		</div>
	);
}

export { TableRowStack, tableRowLinkClass };
