import { createFileRoute } from "@tanstack/react-router";
import { CreateProductPage } from "./-components/create-product-page";

export const Route = createFileRoute("/admin/_superadmin/products/create")({
	staticData: { breadcrumb: "Buat Produk" },
	component: CreateProductPage,
});
