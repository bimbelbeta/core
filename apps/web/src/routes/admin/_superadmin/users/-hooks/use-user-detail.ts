import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";

export function useUserDetail() {
	const { userId } = useParams({ from: "/admin/_superadmin/users/$userId" });

	return useQuery(
		orpc.admin.users.find.queryOptions({
			input: { userId },
		}),
	);
}
