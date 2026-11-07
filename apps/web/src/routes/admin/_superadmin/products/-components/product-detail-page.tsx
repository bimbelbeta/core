import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
	AdminBackLink,
	AdminFormShell,
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { ProductForm } from "./product-form";
import { ProductFormHelpAccordion } from "./product-form-help-accordion";

export function ProductDetailPage() {
	const { productId } = useParams({ from: "/admin/_superadmin/products/$productId" });
	const navigate = useNavigate();
	const { data, isLoading } = useQuery(
		orpc.admin.products.find.queryOptions({
			input: { productId },
		}),
	);
	const handleBack = () => navigate({ to: "/admin/products" });

	if (isLoading) {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<Skeleton className="h-8 w-48" />
					</AdminPageHeaderContent>
				</AdminPageHeader>
				<AdminPageContent className="max-w-none">
					<Skeleton className="h-96 w-full" />
				</AdminPageContent>
			</AdminPageRoot>
		);
	}

	if (!data?.product) {
		return (
			<AdminPageRoot>
				<AdminPageHeader>
					<AdminPageHeaderContent>
						<Typography variant="title">Product tidak ditemukan</Typography>
					</AdminPageHeaderContent>
				</AdminPageHeader>
			</AdminPageRoot>
		);
	}

	const { product } = data;

	return (
		<AdminPageRoot>
			<AdminPageHeader>
				<AdminPageHeaderContent>
					<AdminBackLink to="/admin/products">Kembali ke produk</AdminBackLink>
					<Typography variant="title">Edit Product</Typography>
				</AdminPageHeaderContent>
			</AdminPageHeader>

			<AdminPageContent className="max-w-none">
				<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
					<div className="min-w-0">
						<AdminFormShell>
							<ProductForm
								initialData={{
									id: product.id,
									name: product.name,
									slug: product.slug,
									description: product.description,
									price: product.price,
									type: product.type,
									variant: product.variant,
									fixedExpiryMonth: product.fixedExpiryMonth,
									fixedExpiryDay: product.fixedExpiryDay,
									durationDays: product.durationDays,
									credits: product.credits,
								}}
								onSuccess={handleBack}
								onCancel={handleBack}
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
