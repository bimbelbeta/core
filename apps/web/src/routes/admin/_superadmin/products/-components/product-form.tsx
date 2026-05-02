import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/lib/orpc";
import { months } from "../-utils";

type ProductVariant = "fixed_date" | "monthly" | "credits";
type ProductType = "subscription" | "product";

const PRODUCT_TYPES = ["subscription", "product"] as const;
const PRODUCT_VARIANTS = ["fixed_date", "monthly", "credits"] as const;

function isProductType(v: string): v is ProductType {
	return (PRODUCT_TYPES as readonly string[]).includes(v);
}
function isProductVariant(v: string): v is ProductVariant {
	return (PRODUCT_VARIANTS as readonly string[]).includes(v);
}

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
				type: "'subscription' | 'product'",
				variant: "'fixed_date' | 'monthly' | 'credits'",
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
			className="flex flex-col gap-6"
		>
			<form.Subscribe selector={(state) => [state.values.type, state.values.variant] as const}>
				{([productType, variant]) => <VariantEffect productType={productType} variant={variant} />}
			</form.Subscribe>

			<div className="grid gap-6">
				<form.Field name="name">
					{(field) => (
						<div className="grid gap-2">
							<Label htmlFor={field.name}>Nama Product *</Label>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Contoh: Premium Package"
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-red-500 text-xs">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Field name="slug">
					{(field) => (
						<div className="grid gap-2">
							<Label htmlFor={field.name}>Slug (opsional, auto-generate dari nama)</Label>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Contoh: premium-package"
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="description">
					{(field) => (
						<div className="grid gap-2">
							<Label htmlFor={field.name}>Deskripsi</Label>
							<Textarea
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Deskripsi product..."
								rows={4}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="price">
					{(field) => (
						<div className="grid gap-2">
							<Label htmlFor={field.name}>Harga (IDR) *</Label>
							<Input
								id={field.name}
								type="number"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Contoh: 100000"
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-red-500 text-xs">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<Separator />

				<div className="grid gap-4 md:grid-cols-2">
					<form.Field name="type">
						{(field) => (
							<div className="grid w-full gap-2">
								<Label>Tipe</Label>
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
							</div>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => state.values.type}>
						{(productType) => (
							<form.Field name="variant">
								{(field) => {
									const isSubscription = productType === "subscription";
									const isLockedToCredits = !isSubscription;

									return (
										<div className="grid w-full gap-2">
											<Label>Varian</Label>
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
										</div>
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
										<div className="grid gap-2">
											<Label>Jumlah Credits</Label>
											<Input
												type="number"
												min={1}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.valueAsNumber)}
											/>
										</div>
									)}
								</form.Field>
							)}

							{variant === "fixed_date" && (
								<div className="grid gap-4 md:grid-cols-2">
									<form.Field name="fixedExpiryMonth">
										{(field) => (
											<div className="grid w-full gap-2">
												<Label>Bulan Expired</Label>
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
											</div>
										)}
									</form.Field>

									<form.Field name="fixedExpiryDay">
										{(field) => (
											<div className="grid gap-2">
												<Label>Tanggal Expired</Label>
												<Input
													type="number"
													min={1}
													max={31}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.valueAsNumber)}
												/>
											</div>
										)}
									</form.Field>
								</div>
							)}

							{variant === "monthly" && (
								<form.Field name="durationDays">
									{(field) => (
										<div className="grid gap-2">
											<Label>Durasi (hari)</Label>
											<Input
												type="number"
												min={1}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.valueAsNumber)}
											/>
										</div>
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
					<div className="flex items-center gap-2">
						<Button type="submit" disabled={!canSubmit || isSubmitting || isPending} size="lg">
							{isSubmitting || isPending
								? initialData
									? "Menyimpan..."
									: "Membuat..."
								: initialData
									? "Simpan Perubahan"
									: "Buat Produk"}
						</Button>
						{onCancel && (
							<Button type="button" variant="outline" onClick={onCancel} size="lg">
								Batal
							</Button>
						)}
					</div>
				)}
			</form.Subscribe>
		</form>
	);
}
