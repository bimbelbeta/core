import { useNavigate } from "@tanstack/react-router";
import {
	AdminBackLink,
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
					<AdminBackLink to="/admin/products">Kembali ke produk</AdminBackLink>
					<Typography variant="title">Buat Produk</Typography>
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent className="max-w-none">
				<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
					<div className="min-w-0">
						<AdminFormShell>
							<ProductForm
								onSuccess={(productId) => {
									navigate({ to: "/admin/products/$productId", params: { productId } });
								}}
							/>
						</AdminFormShell>
					</div>
					<aside className="flex min-w-0 flex-col gap-4">
						<ProductFormHelpAccordion />
					</aside>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
