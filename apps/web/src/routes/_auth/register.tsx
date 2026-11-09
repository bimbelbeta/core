import { ArrowLeftIcon, GoogleLogoIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { type } from "arktype";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { createMeta } from "@/lib/seo-utils";

export const Route = createFileRoute("/_auth/register")({
	head: () => ({
		meta: createMeta({
			title: "Daftar",
			description: "Buat akun baru di bimbelbeta dan mulai persiapan SNBT/UTBK kamu sekarang.",
		}),
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="relative flex min-h-screen w-full flex-col items-center px-4 pt-40 pb-12">
			<Button asChild variant="outline" className="absolute top-4 left-4">
				<Link to="/">
					<ArrowLeftIcon />
					Kembali
				</Link>
			</Button>
			<SignUpForm />
		</main>
	);
}

const REGISTER_ERROR_MAP: Record<string, string> = {
	"User already exists": "Pengguna sudah terdaftar. Gunakan email/nama yang lain.",
	"Failed to create user": "Pengguna sudah terdaftar. Gunakan email/nama yang lain.",
};

function translateRegisterError(msg: string): string {
	for (const [key, value] of Object.entries(REGISTER_ERROR_MAP)) {
		if (msg.includes(key)) return value;
	}
	return msg;
}

function SignUpForm() {
	const navigate = useNavigate({
		from: "/",
	});
	const [error, setError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirm_password: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			setSubmitted(true);
			await authClient.signUp.email(
				{
					email: value.email,
					password: "BimbelBeta",
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/login",
						});
					},
					onError: (ctx) => {
						setSubmitted(false);
						setError(translateRegisterError(ctx.error.message || ctx.error.statusText));
					},
				},
			);
		},
		validators: {
			onSubmit: type({
				name: type("string >= 2").configure({
					message: "Nama harus memiliki minimal 2 karakter",
				}),
				email: type("string.email").configure({
					message: "Email tidak valid",
				}),
				// [3.7] password field hidden — fixed password "BimbelBeta" used on submit
				// password: type("string >= 8").configure({
				// 	message: "Password harus memiliki minimal 8 karakter",
				// }),
			}),
		},
	});

	return (
		<div className="relative w-full max-w-md">
			<div className="absolute left-1/2 z-50 -translate-x-1/2 -translate-y-full">
				<Image src="/images/main-card-kelas.webp" alt="Study Avatar" width={200} height={200} />
			</div>
			<Card variant="unpadded" className="border-primary/50 relative z-10 w-full rounded-sm p-8 shadow-lg">
				<div className="flex flex-col items-center gap-2 text-center">
					<Typography variant="display" className="text-primary">
						Mari <span className="font-bold">Mulai Bersama!</span>
					</Typography>
					<Typography>Bergabung bersama untuk memulai sukses</Typography>
				</div>

				<form
					onChange={() => setError(null)}
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="mt-8 space-y-4"
				>
					<div>
						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Nama</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										autoFocus
									/>
									{field.state.meta.errors.map((error) => (
										<Typography key={error?.message} variant="caption" tone="destructive">
											{error?.message}
										</Typography>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<div>
						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<Typography key={error?.message} variant="caption" tone="destructive">
											{error?.message}
										</Typography>
									))}
								</div>
							)}
						</form.Field>
					</div>

					{/* [3.7] password fields hidden — fixed password "BimbelBeta" used on submit */}
					{/* <div>
						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<Typography key={error?.message} variant="caption" tone="destructive">
											{error?.message}
										</Typography>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<div>
						<form.Field
							name="confirm_password"
							validators={{
								onChangeListenTo: ["password"],
								onChange: ({ value, fieldApi }) => {
									if (value !== fieldApi.form.getFieldValue("password"))
										return "Password harus sama. Silakan cek ulang.";
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Re-enter password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<Typography key={error} variant="caption" tone="destructive">
											{error}
										</Typography>
									))}
								</div>
							)}
						</form.Field>
					</div> */}

					<form.Subscribe>
						{(state) => (
							<Button
								isPending={state.isSubmitting || submitted}
								type="submit"
								className="w-full"
								disabled={!state.canSubmit || state.isSubmitting}
							>
								{"Daftar"}
							</Button>
						)}
					</form.Subscribe>
				</form>

				<div className="flex items-center gap-4 py-4">
					<Separator className="flex-1" />
					<span className="text-muted-foreground shrink-0 text-xs uppercase">atau</span>
					<Separator className="flex-1" />
				</div>

				<Button
					onClick={() =>
						authClient.signIn.social({
							provider: "google",
							callbackURL: `${window.location.href}/dashboard`,
						})
					}
					variant="outline"
					className="mt-0 w-full hover:cursor-pointer"
				>
					<GoogleLogoIcon weight="bold" />
					Daftar dengan Google
				</Button>
			</Card>

			{error && (
				<Item variant="destructive" size="sm" className="mt-3">
					<ItemMedia variant="destructive">
						<WarningCircleIcon className="text-destructive" />
					</ItemMedia>
					<ItemContent>
						<ItemDescription className="text-destructive">{error}</ItemDescription>
					</ItemContent>
				</Item>
			)}

			<Typography className="mt-4 text-center">
				Sudah punya akun?{" "}
				<Link to="/login" className="text-primary font-bold">
					Masuk Sekarang
				</Link>
			</Typography>
		</div>
	);
}
