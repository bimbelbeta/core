import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
import { ProductForm } from "./-components/product-form";
import { ProductFormHelpAccordion } from "./-components/product-form-help-accordion";

export const Route = createFileRoute("/admin/_superadmin/products/create")({
	component: CreateProductPage,
});

function CreateProductPage() {
	const navigate = useNavigate();

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminPageTitle>Buat Produk</AdminPageTitle>
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent className="max-w-none">
				<div className="flex flex-col gap-6">
					<ProductFormHelpAccordion />
					<ProductForm
						onSuccess={(productId) => {
							navigate({ to: "/admin/products/$productId", params: { productId } });
						}}
					/>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
