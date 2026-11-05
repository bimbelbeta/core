import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";
import { subjectCategorySchema, tryoutStatusSchema } from "@/lib/schemas";
import { withoutSearchKey } from "@/lib/tanstack-router-utils";

export function useTryoutsList() {
	const navigate = useNavigate({ from: "/admin/tryouts/" });
	const { after, before, limit = 10, search, category, status } = useSearch({ from: "/admin/tryouts/" });

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.tryout.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				category,
				status,
			},
		}),
	);

	const pageInfo = data?.pageInfo;

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

	const deleteMutation = useMutation(
		orpc.admin.tryout.remove.mutationOptions({
			onSuccess: () => {
				toast.success("Tryout berhasil dihapus");
				setDeleteDialogOpen(null);
				refetch();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const baseSearchParams = {
		...(search && { search }),
		...(category && { category }),
		...(status && { status }),
		limit,
	};

	const handleSearch = (value: string) => {
		const withoutSearch = withoutSearchKey(baseSearchParams, "search");
		navigate({ search: value ? { ...baseSearchParams, search: value } : withoutSearch });
	};

	const handleCategoryChange = (value: string) => {
		const rest = withoutSearchKey(baseSearchParams, "category");
		navigate({
			search: value !== "all" ? { ...rest, category: subjectCategorySchema.assert(value) } : rest,
		});
	};

	const handleStatusChange = (value: string) => {
		const rest = withoutSearchKey(baseSearchParams, "status");
		navigate({
			search: value !== "all" ? { ...rest, status: tryoutStatusSchema.assert(value) } : rest,
		});
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	return {
		category,
		status,
		searchInput: search ?? "",
		isAddDialogOpen,
		setIsAddDialogOpen,
		deleteDialogOpen,
		setDeleteDialogOpen,
		data,
		isLoading,
		refetch,
		pageInfo,
		handleSearch,
		handleCategoryChange,
		handleStatusChange,
		handleNext,
		handlePrevious,
		handleDelete,
	};
}
