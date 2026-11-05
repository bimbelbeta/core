import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { usePaginationNavigation } from "@/hooks/use-pagination-navigation";
import { orpc } from "@/lib/orpc";
import { withoutSearchKey } from "@/lib/tanstack-router-utils";
import { isProductVariant } from "../-utils";

export function useProductsList() {
	const navigate = useNavigate({ from: "/admin/products/" });
	const {
		after,
		before,
		limit = 10,
		search,
		variant,
		includeDeleted,
	} = useSearch({ from: "/admin/_superadmin/products/" });
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
		const withoutSearch = withoutSearchKey(baseSearchParams, "search");
		navigate({ search: value ? { ...baseSearchParams, search: value } : withoutSearch });
	};

	const handleVariantChange = (value: string) => {
		const rest = withoutSearchKey(baseSearchParams, "variant");
		navigate({
			search: isProductVariant(value) ? { ...rest, variant: value } : rest,
		});
	};

	const handleIncludeDeletedChange = (value: string) => {
		const rest = withoutSearchKey(baseSearchParams, "includeDeleted");
		navigate({ search: value === "true" ? { ...rest, includeDeleted: true } : rest });
	};

	const { handleNext, handlePrevious } = usePaginationNavigation(navigate, pageInfo, baseSearchParams);

	return {
		data,
		isLoading,
		refetch,
		pageInfo,
		searchInput: search ?? "",
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
