import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";
import { Route } from "../index";

export function useProductsList() {
	const navigate = Route.useNavigate();
	const { after, before, limit = 10, search, variant, includeDeleted } = Route.useSearch();
	const [searchInput, setSearchInput] = useState(search ?? "");
	const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
	const [restoreProductId, setRestoreProductId] = useState<string | null>(null);

	const { data, isLoading, refetch } = useQuery(
		orpc.admin.products.list.queryOptions({
			input: {
				after,
				before,
				limit,
				search: search ?? undefined,
				variant,
				includeDeleted,
			},
		}),
	);

	const pageInfo = data?.pageInfo;
	const baseSearchParams = {
		...(search && { search }),
		...(variant && { variant }),
		...(includeDeleted !== undefined && { includeDeleted }),
		limit,
	};

	const handleSearch = (value: string) => {
		setSearchInput(value);
		navigate({
			search: {
				...(value && { search: value }),
				...(variant && { variant }),
				...(includeDeleted !== undefined && { includeDeleted }),
				limit,
			},
		});
	};

	const handleVariantChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...((value === "fixed_date" || value === "monthly" || value === "credits") && { variant: value }),
				...(includeDeleted !== undefined && { includeDeleted }),
				limit,
			},
		});
	};

	const handleIncludeDeletedChange = (value: string) => {
		navigate({
			search: {
				...(search && { search }),
				...(variant && { variant }),
				...(value === "true" && { includeDeleted: true }),
				limit,
			},
		});
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	return {
		data,
		isLoading,
		refetch,
		pageInfo,
		searchInput,
		variant,
		includeDeleted,
		deleteProductId,
		setDeleteProductId,
		restoreProductId,
		setRestoreProductId,
		handleSearch,
		handleVariantChange,
		handleIncludeDeletedChange,
		handleNext,
		handlePrevious,
	};
}
