import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";
import { Route } from "../$productId";

export function useProductDetail() {
	const { productId } = Route.useParams();
	const navigate = useNavigate();
	const { data, isLoading } = useQuery(
		orpc.admin.products.find.queryOptions({
			input: { productId },
		}),
	);

	const handleBack = () => navigate({ to: "/admin/products" });

	return { data, isLoading, handleBack };
}
