import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";
import { withoutSearchKey } from "@/lib/tanstack-router-utils";

export function useReferralsList() {
	const navigate = useNavigate({ from: "/admin/referrals/" });
	const { after, before, limit = 10, search } = useSearch({ from: "/admin/_superadmin/referrals/" });

	const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.referral.list.queryOptions({
			input: { after, before, limit, search },
		}),
	);

	const { selectedIds, toggleSelectAll, toggleSelectOne, clearSelection, allSelected, someSelected } = useBulkSelection(
		data?.items,
	);

	const pageInfo = data?.pageInfo;
	const baseSearchParams = {
		...(search && { search }),
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

	const bulkDeactivateMutation = useMutation(
		orpc.admin.referral.bulkDeactivate.mutationOptions({
			onSuccess: (res) => {
				toast.success(res.message);
				clearSelection();
				setBulkDialogOpen(false);
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

	const handleToggleStatus = (codeId: string, status: boolean) => toggleStatusMutation.mutate({ codeId, status });

	const handleBulkDeactivate = () => bulkDeactivateMutation.mutate({ codeIds: selectedIds });

	return {
		data,
		isLoading,
		refetch,
		pageInfo,
		search,
		selectedIds,
		bulkDialogOpen,
		setBulkDialogOpen,
		handleNext,
		handlePrevious,
		handleReset,
		handleSearch,
		handleToggleStatus,
		handleBulkDeactivate,
		toggleSelectAll,
		toggleSelectOne,
		allSelected,
		someSelected,
	};
}
