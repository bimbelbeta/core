import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";

export function useUsersList() {
	const {
		after,
		before,
		limit = 10,
		search,
		role,
		isPremium,
	} = useSearch({
		from: "/admin/_superadmin/users/",
	});

	return useQuery(
		orpc.admin.users.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				role,
				isPremium,
			},
		}),
	);
}
