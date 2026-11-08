import { FloppyDiskIcon, XIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";
import { type ProductType, type ProductVariant, productTypeSchema, productVariantSchema } from "@/lib/schemas";
import { isProductVariant, months } from "../-utils";

const isProductType = (v: string): v is ProductType => productTypeSchema.allows(v);

interface ProductFormProps {
	initialData?: {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		price: string;
		type: ProductType;
		variant: ProductVariant;
		fixedExpiryMonth: number | null;
		fixedExpiryDay: number | null;
		durationDays: number | null;
		credits: number | null;
	};
	onSuccess: (productId: string) => void;
	onCancel?: () => void;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
	const form = useForm({
		defaultValues: {
			name: initialData?.name ?? "",
			slug: initialData?.slug ?? "",
			description: initialData?.description ?? "",
			price: initialData?.price ?? "",
			type: initialData?.type ?? "product",
			variant: initialData?.variant ?? (initialData?.type === "subscription" ? "monthly" : "credits"),
			fixedExpiryMonth: initialData?.fixedExpiryMonth ?? 1,
			fixedExpiryDay: initialData?.fixedExpiryDay ?? 1,
			durationDays: initialData?.durationDays ?? 30,
			credits: initialData?.credits ?? 1,
		},
		onSubmit: async ({ value }) => {
			const normalizedVariant: ProductVariant =
				value.type === "subscription" ? (value.variant === "credits" ? "monthly" : value.variant) : "credits";

			const baseInput = {
				name: value.name.trim(),
				slug: value.slug.trim() || undefined,
				description: value.description.trim() || undefined,
				price: value.price.trim(),
				type: value.type,
				variant: normalizedVariant,
				fixedExpiryMonth: normalizedVariant === "fixed_date" ? value.fixedExpiryMonth : undefined,
				fixedExpiryDay: normalizedVariant === "fixed_date" ? value.fixedExpiryDay : undefined,
				durationDays: normalizedVariant === "monthly" ? value.durationDays : undefined,
				credits: normalizedVariant === "credits" ? value.credits : undefined,
			};

			if (initialData) {
				await updateMutation.mutateAsync({
					productId: initialData.id,
					...baseInput,
				});
			} else {
				await createMutation.mutateAsync(baseInput);
			}
		},
		validators: {
			onChange: type({
				name: "string >= 1",
				price: "string >= 1",
				type: productTypeSchema,
				variant: productVariantSchema,
			}),
		},
	});

	const createMutation = useMutation(
		orpc.admin.products.create.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				onSuccess(data.id);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.admin.products.update.mutationOptions({
			onSuccess: (data) => {
				toast.success(data.message);
				onSuccess(initialData!.id);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const isPending = createMutation.isPending || updateMutation.isPending;
	const prevVariantRef = useRef<ProductVariant | null>(null);

	function VariantEffect({ productType, variant }: { productType: ProductType; variant: ProductVariant }) {
		const desiredVariant: ProductVariant =
			productType === "subscription" ? (variant === "credits" ? "monthly" : variant) : "credits";

		useEffect(() => {
			if (desiredVariant !== variant) {
				form.setFieldValue("variant", desiredVariant);
			}
		}, [desiredVariant, variant]);

		useEffect(() => {
			if (desiredVariant !== variant) return;
			const prevVariant = prevVariantRef.current;
			prevVariantRef.current = variant;
			if (prevVariant === null || prevVariant === variant) return;

			if (variant === "fixed_date") {
				form.setFieldValue("fixedExpiryMonth", 1);
				form.setFieldValue("fixedExpiryDay", 1);
				return;
			}

			if (variant === "monthly") {
				form.setFieldValue("durationDays", 30);
				return;
			}

			form.setFieldValue("credits", 1);
		}, [desiredVariant, variant]);

		return null;
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="flex flex-col gap-4"
		>
			<form.Subscribe selector={(state) => [state.values.type, state.values.variant] as const}>
				{([productType, variant]) => <VariantEffect productType={productType} variant={variant} />}
			</form.Subscribe>

			<div className="flex flex-col gap-4">
				<form.Field name="name">
					{(field) => (
						<AdminFieldRow label="Nama Produk" htmlFor={field.name}>
							<div className="flex flex-col gap-1.5">
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: Premium Package"
								/>
								{field.state.meta.errors.map((error) => (
									<Typography key={error?.message} variant="caption" tone="destructive">
										{error?.message}
									</Typography>
								))}
							</div>
						</AdminFieldRow>
					)}
				</form.Field>

				<form.Field name="slug">
					{(field) => (
						<AdminFieldRow label="Slug" hint="Kosongkan untuk dibuat otomatis dari nama." htmlFor={field.name} optional>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Contoh: premium-package"
							/>
						</AdminFieldRow>
					)}
				</form.Field>

				<form.Field name="description">
					{(field) => (
						<AdminFieldRow label="Deskripsi" htmlFor={field.name}>
							<Textarea
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Deskripsi produk..."
								rows={4}
							/>
						</AdminFieldRow>
					)}
				</form.Field>

				<form.Field name="price">
					{(field) => (
						<AdminFieldRow label="Harga (IDR)" htmlFor={field.name}>
							<div className="flex flex-col gap-1.5">
								<Input
									id={field.name}
									type="number"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Contoh: 100000"
								/>
								{field.state.meta.errors.map((error) => (
									<Typography key={error?.message} variant="caption" tone="destructive">
										{error?.message}
									</Typography>
								))}
							</div>
						</AdminFieldRow>
					)}
				</form.Field>

				<Separator />

				<div className="flex flex-col gap-4">
					<form.Field name="type">
						{(field) => (
							<AdminFieldRow label="Tipe" htmlFor="product-type">
								<Select
									value={field.state.value}
									onValueChange={(v) => {
										if (!isProductType(v)) return;
										field.handleChange(v);

										if (v === "product") {
											form.setFieldValue("variant", "credits");
										} else {
											const currentVariant = form.getFieldValue("variant");
											if (currentVariant === "credits") {
												form.setFieldValue("variant", "monthly");
											}
										}
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="subscription">Langganan</SelectItem>
										<SelectItem value="product">Produk</SelectItem>
									</SelectContent>
								</Select>
							</AdminFieldRow>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => state.values.type}>
						{(productType) => (
							<form.Field name="variant">
								{(field) => {
									const isSubscription = productType === "subscription";
									const isLockedToCredits = !isSubscription;

									return (
										<AdminFieldRow label="Varian" htmlFor="product-variant">
											<Select
												disabled={isLockedToCredits}
												value={field.state.value}
												onValueChange={(v) => {
													if (isProductVariant(v)) field.handleChange(v);
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{isSubscription ? (
														<>
															<SelectItem value="monthly">Bulanan</SelectItem>
															<SelectItem value="fixed_date">Tanggal Tetap</SelectItem>
														</>
													) : (
														<SelectItem value="credits">Credits</SelectItem>
													)}
												</SelectContent>
											</Select>
										</AdminFieldRow>
									);
								}}
							</form.Field>
						)}
					</form.Subscribe>
				</div>

				<form.Subscribe selector={(state) => [state.values.type, state.values.variant]}>
					{([productType, variant]) => (
						<>
							{productType !== "subscription" && (
								<form.Field name="credits">
									{(field) => (
										<AdminFieldRow label="Jumlah Credits" htmlFor="product-credits">
											<Input
												id="product-credits"
												type="number"
												min={1}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.valueAsNumber)}
											/>
										</AdminFieldRow>
									)}
								</form.Field>
							)}

							{variant === "fixed_date" && (
								<>
									<form.Field name="fixedExpiryMonth">
										{(field) => (
											<AdminFieldRow label="Bulan Expired" htmlFor="product-expiry-month">
												<Select
													value={field.state.value.toString()}
													onValueChange={(v) => field.handleChange(Number.parseInt(v, 10))}
												>
													<SelectTrigger className="w-full">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{months.map((m) => (
															<SelectItem key={m.value} value={m.value.toString()}>
																{m.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</AdminFieldRow>
										)}
									</form.Field>

									<form.Field name="fixedExpiryDay">
										{(field) => (
											<AdminFieldRow label="Tanggal Expired" htmlFor="product-expiry-day">
												<Input
													id="product-expiry-day"
													type="number"
													min={1}
													max={31}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.valueAsNumber)}
												/>
											</AdminFieldRow>
										)}
									</form.Field>
								</>
							)}

							{variant === "monthly" && (
								<form.Field name="durationDays">
									{(field) => (
										<AdminFieldRow label="Durasi (hari)" htmlFor="product-duration-days">
											<Input
												id="product-duration-days"
												type="number"
												min={1}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.valueAsNumber)}
											/>
										</AdminFieldRow>
									)}
								</form.Field>
							)}
						</>
					)}
				</form.Subscribe>
			</div>

			<Separator />

			<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
				{([canSubmit, isSubmitting]) => (
					<div className="flex items-center justify-end gap-1">
						{onCancel && (
							<Button type="button" variant="outline" size="xs" onClick={onCancel}>
								<XIcon className="size-3.5" />
								Batal
							</Button>
						)}
						<Button
							size="xs"
							isPending={isSubmitting || isPending}
							type="submit"
							disabled={!canSubmit || isSubmitting || isPending}
						>
							{initialData && <FloppyDiskIcon className="size-3.5" />}
							{initialData ? "Simpan Perubahan" : "Buat Produk"}
						</Button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
}
