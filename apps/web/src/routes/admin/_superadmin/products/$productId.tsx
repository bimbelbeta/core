import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "./-components/product-detail-page";

export const Route = createFileRoute("/admin/_superadmin/products/$productId")({
	staticData: { breadcrumb: "Edit Product" },
	component: ProductDetailPage,
});
