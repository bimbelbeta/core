import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Typography } from "@/components/ui/typography";
import { useUsersSelectionState } from "../-hooks/use-users-selection";
import { UsersBulkActions } from "./users-bulk-actions";
import { UsersSelectionContext } from "./users-selection-context";
import { UsersTable } from "./users-table";
import { UsersToolbar } from "./users-toolbar";

export function UsersListPage() {
	const selection = useUsersSelectionState();

	return (
		<UsersSelectionContext value={selection}>
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<Typography variant="title">User Management</Typography>
					</AdminPageHeaderContent>
					<AdminPageHeaderActions />
				</AdminPageHeader>

				<AdminPageContent>
					<UsersToolbar />
					<UsersBulkActions />
					<UsersTable />
				</AdminPageContent>
			</AdminPageRoot>
		</UsersSelectionContext>
	);
}
