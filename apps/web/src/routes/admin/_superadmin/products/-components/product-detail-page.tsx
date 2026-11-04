import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
	AdminPageContent,
	AdminPageHeader,
	AdminPageHeaderActions,
	AdminPageHeaderContent,
	AdminPageRoot,
} from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
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
					<Typography variant="title">Edit Product</Typography>
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
						onSuccess={handleBack}
						onCancel={handleBack}
					/>
				</div>
			</AdminPageContent>
		</AdminPageRoot>
	);
}
