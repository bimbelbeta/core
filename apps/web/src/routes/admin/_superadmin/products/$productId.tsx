import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
	AdminPageTitle,
} from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { ProductForm } from "./-components/product-form";
import { ProductFormHelpAccordion } from "./-components/product-form-help-accordion";

export const Route = createFileRoute("/admin/_superadmin/products/$productId")({
	staticData: { breadcrumb: "Edit Product" },
	component: ProductDetailPage,
});

function ProductDetailPage() {
	const { productId } = Route.useParams();
	const navigate = useNavigate();

	const { data, isLoading } = useQuery(
		orpc.admin.products.find.queryOptions({
			input: { productId },
		}),
	);

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
						<AdminPageTitle>Product tidak ditemukan</AdminPageTitle>
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
					<AdminPageTitle>Edit Product</AdminPageTitle>
				</AdminPageHeaderContent>
				<AdminPageHeaderActions>
					<Button variant="outline" asChild>
						<Link to="/admin/products">
							<ArrowLeftIcon className="size-4" />
							Kembali
						</Link>
					</Button>
				</AdminPageHeaderActions>
			</AdminPageHeader>

			<AdminPageContent className="max-w-none">
				<div className="flex flex-col gap-6">
					<ProductFormHelpAccordion />
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
						onSuccess={() => {
							navigate({ to: "/admin/products" });
						}}
						onCancel={() => {
							navigate({ to: "/admin/products" });
						}}
					/>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
