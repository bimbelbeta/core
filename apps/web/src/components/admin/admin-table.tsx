import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";

interface AdminTableRootProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableRoot({ children, className }: AdminTableRootProps) {
	return (
		<div className={cn("bg-card flex min-h-0 flex-col overflow-clip rounded-lg border max-sm:flex-none", className)}>
			{children}
		</div>
	);
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
			<TableRow className={className}>{children}</TableRow>
		</TableHeader>
	);
}

interface AdminTableHeadProps {
	children?: React.ReactNode;
	className?: string;
}

export function AdminTableHead({ children, className }: AdminTableHeadProps) {
	return <TableHead className={className}>{children}</TableHead>;
}

interface AdminTableBodyProps {
	children: React.ReactNode;
	isLoading?: boolean;
	isEmpty?: boolean;
	isError?: boolean;
	onRetry?: () => void;
	emptyMessage?: string;
	emptyAction?: React.ReactNode;
	columns?: number;
	className?: string;
}

export function AdminTableBody({
	children,
	isLoading,
	isEmpty,
	isError,
	onRetry,
	emptyMessage = "Tidak ada data ditemukan.",
	emptyAction,
	columns = 6,
	className,
}: AdminTableBodyProps) {
	const colSpan = columns;

	if (isError) {
		return (
			<TableBody>
				<TableRow>
					<TableCell colSpan={colSpan} className="h-32 text-center">
						<p className="text-destructive">Data gagal dimuat.</p>
						<div className="mt-3 flex justify-center">
							<Button variant="outline" size="xs" onClick={onRetry} disabled={!onRetry}>
								Coba lagi
							</Button>
						</div>
					</TableCell>
				</TableRow>
			</TableBody>
		);
	}

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
					<TableCell colSpan={colSpan} className="text-muted-foreground h-32 text-center">
						<p>{emptyMessage}</p>
						{emptyAction && <div className="mt-3 flex justify-center">{emptyAction}</div>}
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
	return <TableRow className={cn("group hover:bg-muted/70 relative", className)}>{children}</TableRow>;
}

interface AdminTableCellProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableCell({ children, className }: AdminTableCellProps) {
	return <TableCell className={className}>{children}</TableCell>;
}
