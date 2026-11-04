import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";

export function useProductDetail() {
	const { productId } = useParams({ from: "/admin/_superadmin/products/$productId" });
	const navigate = useNavigate();
	const { data, isLoading } = useQuery(
		orpc.admin.products.find.queryOptions({
			input: { productId },
		}),
	);

	const handleBack = () => navigate({ to: "/admin/products" });

	return { data, isLoading, handleBack };
}
