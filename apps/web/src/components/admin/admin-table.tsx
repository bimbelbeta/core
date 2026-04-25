import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";

interface AdminTableRootProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableRoot({ children, className }: AdminTableRootProps) {
	return <div className={cn("overflow-clip rounded-lg border bg-white shadow-sm", className)}>{children}</div>;
}

interface AdminTableProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTable({ children, className }: AdminTableProps) {
	return <Table className={className}>{children}</Table>;
}

interface AdminTableHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableHeader({ children, className }: AdminTableHeaderProps) {
	return (
		<TableHeader>
			<TableRow className={cn("bg-muted/30", className)}>{children}</TableRow>
		</TableHeader>
	);
}

interface AdminTableHeadProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableHead({ children, className }: AdminTableHeadProps) {
	return <TableHead className={className}>{children}</TableHead>;
}

interface AdminTableBodyProps {
	children: React.ReactNode;
	isLoading?: boolean;
	isEmpty?: boolean;
	emptyMessage?: string;
	columns?: number;
	className?: string;
}

export function AdminTableBody({
	children,
	isLoading,
	isEmpty,
	emptyMessage = "Tidak ada data ditemukan.",
	columns = 6,
	className,
}: AdminTableBodyProps) {
	const colSpan = columns;

	if (isLoading) {
		return (
			<TableBody>
				<TableSkeleton columns={colSpan} />
			</TableBody>
		);
	}

	if (isEmpty) {
		return (
			<TableBody>
				<TableRow>
					<TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
						{emptyMessage}
					</TableCell>
				</TableRow>
			</TableBody>
		);
	}

	return <TableBody className={className}>{children}</TableBody>;
}

interface AdminTableRowProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableRow({ children, className }: AdminTableRowProps) {
	return <TableRow className={cn("group hover:bg-muted/30", className)}>{children}</TableRow>;
}

interface AdminTableCellProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableCell({ children, className }: AdminTableCellProps) {
	return <TableCell className={className}>{children}</TableCell>;
}
