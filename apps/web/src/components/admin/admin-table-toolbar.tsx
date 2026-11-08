import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

interface AdminTableToolbarProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	onReset?: () => void;
	searchPlaceholder?: string;
	searchClassName?: string;
	children?: React.ReactNode;
	trailing?: React.ReactNode;
	className?: string;
}

export function AdminTableToolbar({
	searchValue,
	onSearchChange,
	onReset,
	searchPlaceholder = "Cari...",
	searchClassName,
	children,
	trailing,
	className,
}: AdminTableToolbarProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-2.5 [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:min-w-0 [&_[data-slot=select-trigger]]:shadow-none sm:[&_[data-slot=select-trigger]]:min-w-44 [&_[data-slot=select-value]]:whitespace-nowrap",
				className,
			)}
		>
			<SearchInput
				value={searchValue}
				onChange={onSearchChange}
				placeholder={searchPlaceholder}
				className={cn("h-8 w-full shadow-none sm:max-w-xs", searchClassName)}
			/>
			{children && <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto">{children}</div>}
			{trailing && <div className="w-full sm:ml-auto sm:w-auto">{trailing}</div>}
			{onReset && (
				<Button variant="ghost" size="xs" className="text-muted-foreground" onClick={onReset}>
					Hapus filter
				</Button>
			)}
		</div>
	);
}

interface AdminTablePaginationWrapperProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTablePaginationWrapper({ children, className }: AdminTablePaginationWrapperProps) {
	return <div className={cn("border-t px-3 py-2", className)}>{children}</div>;
}
