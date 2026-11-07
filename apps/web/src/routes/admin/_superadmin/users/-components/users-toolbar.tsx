import { ROLES } from "@bimbelbeta/contract/common/roles";
import { AdminChip, AdminMeta, AdminStatus } from "@/components/admin/admin-status";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsersNavigation } from "../-hooks/use-users-navigation";
import { roleConfig } from "../-utils";

export function UsersToolbar() {
	const { searchInput, role, isPremium, handleSearch, handleRoleChange, handlePremiumChange, handleReset } =
		useUsersNavigation();
	const hasFilters = Boolean(searchInput || role || isPremium !== undefined);
	const roleOptions = [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN] as const;

	return (
		<AdminTableToolbar
			searchValue={searchInput}
			onSearchChange={handleSearch}
			searchPlaceholder="Cari nama atau email..."
			onReset={hasFilters ? handleReset : undefined}
		>
			<Select value={role ?? "all"} onValueChange={handleRoleChange}>
				<SelectTrigger className="w-full sm:w-40">
					<SelectValue placeholder="Semua role" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Semua role</SelectItem>
					{roleOptions.map((role) => {
						const roleInfo = roleConfig[role];
						return (
							<SelectItem key={role} value={role}>
								{roleInfo.tone === "neutral" ? (
									<AdminMeta>{roleInfo.label}</AdminMeta>
								) : (
									<AdminChip tone="accent">{roleInfo.label}</AdminChip>
								)}
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
			<Select
				value={isPremium === undefined ? "all" : isPremium ? "true" : "false"}
				onValueChange={handlePremiumChange}
			>
				<SelectTrigger className="w-full sm:w-40">
					<SelectValue placeholder="Semua status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Semua status</SelectItem>
					<SelectItem value="true">
						<AdminStatus tone="positive">Premium</AdminStatus>
					</SelectItem>
					<SelectItem value="false">
						<AdminMeta>Non-Premium</AdminMeta>
					</SelectItem>
				</SelectContent>
			</Select>
		</AdminTableToolbar>
	);
}
