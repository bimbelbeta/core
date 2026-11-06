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
				"flex flex-wrap items-center gap-3 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:min-w-0 [&_[data-slot=select-trigger]]:shadow-none sm:[&_[data-slot=select-trigger]]:min-w-44 [&_[data-slot=select-value]]:whitespace-nowrap",
				className,
			)}
		>
			<SearchInput
				value={searchValue}
				onChange={onSearchChange}
				placeholder={searchPlaceholder}
				className={cn("h-9 w-full shadow-none sm:max-w-xs", searchClassName)}
			/>
			{children && <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto">{children}</div>}
			{trailing && <div className="sm:ml-auto">{trailing}</div>}
			{onReset && (
				<Button variant="ghost" size="sm" className="text-muted-foreground h-9" onClick={onReset}>
					Hapus filter
				</Button>
			)}
		</div>
	);
}

interface AdminTableBulkActionsProps {
	selectedCount: number;
	children?: React.ReactNode;
	trailing?: React.ReactNode;
	className?: string;
}

export function AdminTableBulkActions({ selectedCount, children, className }: AdminTableBulkActionsProps) {
	if (selectedCount === 0) return null;

	return (
		<div
			className={cn(
				"border-primary-navy-200 bg-primary-navy-50 flex h-9 items-center gap-2 rounded-md border px-2",
				className,
			)}
		>
			<span className="text-primary-navy-700 text-sm">{selectedCount} item dipilih</span>
			<div className="ml-auto">{children}</div>
		</div>
	);
}

interface AdminTablePaginationWrapperProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTablePaginationWrapper({ children, className }: AdminTablePaginationWrapperProps) {
	return <div className={cn("border-t px-4 py-2.5", className)}>{children}</div>;
}
