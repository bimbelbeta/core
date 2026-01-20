import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

type BackButtonProps = {
	to: string;
	search?: Record<string, string | number | boolean | undefined>;
};

export function BackButton({ to, search }: BackButtonProps) {
	return (
		<Link
			to={to}
			search={search}
			className={cn(buttonVariants({ size: "sm" }), "gap-2 px-3.5 py-2 text-white text-xs shadow-xs")}
		>
			<ArrowLeftIcon size={20} weight="bold" />
			Kembali
		</Link>
	);
}
