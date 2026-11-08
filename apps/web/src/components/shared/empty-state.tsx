import { WarningCircleIcon } from "@phosphor-icons/react";
import type * as React from "react";
import { Typography } from "@/components/ui/typography";

export function EmptyState({
	icon,
	title = "Ups, kontennya belum tersedia",
	desc = "Tunggu kontennya diracik dulu ya!",
	action,
}: {
	icon?: React.ReactNode;
	title?: string;
	desc?: string | null;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
			{icon ?? <WarningCircleIcon size={80} />}
			<Typography variant="subtitle2" as="p">
				{title}
			</Typography>
			{desc && (
				<Typography variant="caption" className="max-w-sm text-balance">
					{desc}
				</Typography>
			)}
			{action}
		</div>
	);
}
