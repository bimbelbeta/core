import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { type } from "arktype";
import { toast } from "sonner";
import Loader from "@/components/shared/loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { authClient } from "@/lib/auth-client";
import { createMeta } from "@/lib/seo-utils";

const searchSchema = type({
	token: "string",
});

export const Route = createFileRoute("/_auth/reset-password")({
	head: () => ({
		meta: createMeta({
			title: "Reset Password",
			description: "Atur ulang password akun bimbelbeta kamu.",
		}),
	}),
	component: RouteComponent,
	validateSearch: searchSchema,
});

function RouteComponent() {
	return (
		<main className="flex min-h-screen w-full flex-col items-center pt-32">
			<ResetPasswordForm />
		</main>
	);
}

function ResetPasswordForm() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			if (value.newPassword !== value.confirmPassword) {
				toast.error("Password tidak sama");
				return;
			}
			await authClient.resetPassword(
				{
					newPassword: value.newPassword,
					token: search.token,
				},
				{
					onSuccess: () => {
						toast.success("Password berhasil diubah");
						navigate({ to: "/login" });
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: type({
				newPassword: "string >= 8",
				confirmPassword: "string >= 8",
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="w-full max-w-md">
			<Image src="/avatar/study-avatar.webp" alt="Study Avatar" width={128} height={128} className="mx-auto" />
			<Card variant="plain" className="border-primary/50 w-full rounded-sm p-8 shadow-lg">
				<div className="flex flex-col items-center gap-2 text-center">
					{" "}
					<Typography variant="display" className="text-primary">
						<span className="font-bold">Reset </span>
						Password
					</Typography>
					<Typography>Masukkan password baru anda</Typography>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="mt-8 space-y-4"
				>
					<div>
						<form.Field name="newPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Password Baru</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoFocus
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
						<form.Field name="confirmPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Konfirmasi Password</Label>
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

					<form.Subscribe>
						{(state) => (
							<Button type="submit" className="w-full" disabled={!state.canSubmit || state.isSubmitting}>
								{state.isSubmitting ? "Memuat..." : "Ubah Password"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</Card>

			<Typography className="mt-4 text-center">
				Sudah punya akun?{" "}
				<Link to="/login" className="text-primary font-bold">
					Masuk
				</Link>
			</Typography>
		</div>
	);
}
