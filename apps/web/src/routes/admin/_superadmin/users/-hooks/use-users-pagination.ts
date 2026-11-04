import { useNavigate, useSearch } from "@tanstack/react-router";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { useUsersList } from "./use-users-list";

export function useUsersPagination() {
	const navigate = useNavigate({ from: "/admin/users/" });
	const { limit = 10, search, role, isPremium } = useSearch({ from: "/admin/_superadmin/users/" });
	const { data } = useUsersList();

	return usePaginationNavigation(navigate, data?.pageInfo, {
		...(search && { search }),
		...(role && { role }),
		...(isPremium !== undefined && { isPremium }),
		limit,
	});
}
