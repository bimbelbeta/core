import { useMutation, useQuery } from "@tanstack/react-query";
import { type } from "arktype";
import { useState } from "react";
import { toast } from "sonner";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";
import { Route } from "../index";

export function useTryoutsList() {
	const navigate = Route.useNavigate();
	const { after, before, limit = 10, search, category, status } = Route.useSearch();

	const [searchInput, setSearchInput] = useState(search ?? "");

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
		setSearchInput(value);
		navigate({
			search: {
				...(value && { search: value }),
				...(category && { category }),
				...(status && { status }),
				limit,
			},
		});
	};

	const handleCategoryChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(value !== "all" && { category: type("'sd' | 'smp' | 'sma' | 'utbk'").assert(value) }),
				...(status && { status }),
				limit,
			},
		});
	};

	const handleStatusChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(category && { category }),
				...(value !== "all" && { status: type("'draft' | 'published' | 'archived'").assert(value) }),
				limit,
			},
		});
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	return {
		category,
		status,
		searchInput,
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
