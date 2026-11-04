import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";

export function useReferralsList() {
	const navigate = useNavigate({ from: "/admin/referrals/" });
	const { after, before, limit = 10, search } = useSearch({ from: "/admin/_superadmin/referrals/" });

	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.referral.list.queryOptions({
			input: { after, before, limit, search },
		}),
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
				setSelectedIds([]);
				setBulkDialogOpen(false);
				refetch();
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const toggleSelectAll = () => {
		if (selectedIds.length === (data?.items.length ?? 0)) {
			setSelectedIds([]);
		} else {
			setSelectedIds(data?.items.map((c) => c.id) ?? []);
		}
	};

	const toggleSelectOne = (id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
	};

	const allSelected = selectedIds.length === (data?.items.length ?? 0) && (data?.items.length ?? 0) > 0;
	const someSelected = selectedIds.length > 0 && selectedIds.length < (data?.items.length ?? 0);
	const handleSearch = (value: string) => navigate({ search: value ? { search: value, limit } : baseSearchParams });

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
		handleSearch,
		handleToggleStatus,
		handleBulkDeactivate,
		toggleSelectAll,
		toggleSelectOne,
		allSelected,
		someSelected,
	};
}
