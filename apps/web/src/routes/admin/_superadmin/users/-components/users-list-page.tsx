import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Typography } from "@/components/ui/typography";
import { UsersTable } from "./users-table";
import { UsersToolbar } from "./users-toolbar";

export function UsersListPage() {
	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Pengguna</Typography>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions />
			</AdminPageHeader>

			<AdminPageContent>
				<UsersToolbar />
				<UsersTable />
			</AdminPageContent>
		</AdminPageRoot>
	);
}
