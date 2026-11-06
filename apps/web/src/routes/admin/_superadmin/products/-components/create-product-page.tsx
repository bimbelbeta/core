import { useNavigate } from "@tanstack/react-router";
import {
	AdminFormShell,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Typography } from "@/components/ui/typography";
import { ProductForm } from "./product-form";
import { ProductFormHelpAccordion } from "./product-form-help-accordion";

export function CreateProductPage() {
	const navigate = useNavigate();

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<Typography variant="title">Buat Produk</Typography>
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent className="max-w-none">
				<AdminFormShell>
					<ProductFormHelpAccordion />
					<ProductForm
						onSuccess={(productId) => {
							navigate({ to: "/admin/products/$productId", params: { productId } });
						}}
					/>
				</AdminFormShell>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
