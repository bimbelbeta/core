import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";
import { withoutSearchKey } from "@/lib/tanstack-router-utils";

export function useReferralsList() {
	const navigate = useNavigate({ from: "/admin/referrals/" });
	const { after, before, limit = 10, search, status } = useSearch({ from: "/admin/_superadmin/referrals/" });

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.referral.list.queryOptions({
			input: { after, before, limit, search, status },
		}),
	);

	const pageInfo = data?.pageInfo;
	const baseSearchParams = {
		...(search && { search }),
		...(status !== undefined && { status }),
		limit,
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	const toggleStatusMutation = useMutation(
		orpc.admin.referral.updateStatus.mutationOptions({
			onSuccess: (res) => {
				toast.success(res.message);
				refetch();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const handleSearch = (value: string) => {
		const withoutSearch = withoutSearchKey(baseSearchParams, "search");
		navigate({ search: value ? { search: value, limit } : withoutSearch });
	};

	const handleReset = () => {
		navigate({ search: { limit } });
	};

	const handleStatusChange = (value: string) => {
		const rest = withoutSearchKey(baseSearchParams, "status");
		navigate({ search: value === "all" ? rest : { ...rest, status: value === "true" } });
	};

	const handleToggleStatus = (codeId: string, status: boolean) => toggleStatusMutation.mutate({ codeId, status });

	return {
		data,
		isLoading,
		refetch,
		pageInfo,
		search,
		status,
		handleNext,
		handlePrevious,
		handleReset,
		handleSearch,
		handleStatusChange,
		handleToggleStatus,
	};
}
