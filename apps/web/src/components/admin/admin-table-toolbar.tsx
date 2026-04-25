import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

interface AdminTableToolbarProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;
	searchClassName?: string;
	children?: React.ReactNode;
	className?: string;
}

export function AdminTableToolbar({
	searchValue,
	onSearchChange,
	searchPlaceholder = "Cari...",
	searchClassName,
	children,
	className,
}: AdminTableToolbarProps) {
	return (
		<div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
			<SearchInput
				value={searchValue}
				onChange={onSearchChange}
				placeholder={searchPlaceholder}
				className={cn("w-full sm:max-w-sm md:max-w-md", searchClassName)}
			/>
			{children && <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{children}</div>}
		</div>
	);
}

interface AdminTableBulkActionsProps {
	selectedCount: number;
	children?: React.ReactNode;
	className?: string;
}

export function AdminTableBulkActions({ selectedCount, children, className }: AdminTableBulkActionsProps) {
	if (selectedCount === 0) return null;

	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-md border border-primary-navy-200 bg-primary-navy-50 p-2",
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
	return <div className={cn("border-t p-4", className)}>{children}</div>;
}
