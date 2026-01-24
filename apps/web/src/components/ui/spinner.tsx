import { CircleNotchIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const Spinner = ({ size = "base", className }: { size?: "sm" | "base"; className?: string }) => {
	return <CircleNotchIcon weight="bold" className={cn("animate-spin", size === "sm" && "size-4", className)} />;
};
