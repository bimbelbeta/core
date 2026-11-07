import { ROLES } from "@bimbelbeta/contract/common/roles";
import { AdminTableToolbar } from "@/components/admin/admin-table-toolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsersNavigation } from "../-hooks/use-users-navigation";

export function UsersToolbar() {
	const { searchInput, role, isPremium, handleSearch, handleRoleChange, handlePremiumChange, handleReset } =
		useUsersNavigation();
	const hasFilters = Boolean(searchInput || role || isPremium !== undefined);
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
					<SelectItem value={ROLES.USER}>User</SelectItem>
					<SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
					<SelectItem value={ROLES.SUPER_ADMIN}>Superadmin</SelectItem>
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
					<SelectItem value="true">Premium</SelectItem>
					<SelectItem value="false">Non-Premium</SelectItem>
				</SelectContent>
			</Select>
		</AdminTableToolbar>
	);
}
