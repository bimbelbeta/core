import { ROLES } from "@bimbelbeta/contract/common/roles";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, GoogleLogoIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { type } from "arktype";
import { useState } from "react";
import Loader from "@/components/shared/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { createMeta } from "@/lib/seo-utils";

export const Route = createFileRoute("/_auth/login")({
	head: () => ({
		meta: createMeta({
			title: "Masuk",
			description: "Masuk ke akun bimbelbeta untuk memulai persiapan SNBT/UTBK kamu.",
		}),
	}),
	component: RouteComponent,
});

type AuthError = { status?: number; message?: string; statusText?: string };

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;

const normalizeIdentifier = (raw: string) => {
	const cleaned = raw.normalize("NFKC").replace(ZERO_WIDTH, "").trim();
	return cleaned.includes("@") ? cleaned.toLowerCase() : cleaned;
};

const getAuthErrorMessage = (err: AuthError) => {
	if (err.status === 400 || err.status === 401) return "Username/email atau password salah.";
	if (err.status === 429) return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
	if (!err.status || err.status >= 500) return "Koneksi bermasalah. Periksa jaringan kamu lalu coba lagi.";
	return err.message || err.statusText || "Terjadi kesalahan. Coba lagi.";
};

function RouteComponent() {
	return (
		<main className="relative flex min-h-screen w-full flex-col items-center px-4 pt-40 pb-12">
			<Button asChild variant="outline" className="absolute top-4 left-4">
				<Link to="/">
					<ArrowLeftIcon />
					Kembali
				</Link>
			</Button>
			<SignInForm />
		</main>
	);
}

function SignInForm() {
	const navigate = useNavigate({
		from: "/",
	});
	const queryClient = useQueryClient();
	const { isPending } = authClient.useSession();
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const onSignInSuccess = async () => {
		const session = await authClient.getSession();
		const user = session.data?.user;
		if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
			navigate({ to: "/admin/dashboard" });
		} else {
			navigate({ to: "/dashboard" });
		}
	};

	const form = useForm({
		defaultValues: {
			identifier: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			queryClient.removeQueries();

			const identifier = normalizeIdentifier(value.identifier);
			const callbacks = {
				onSuccess: onSignInSuccess,
				onError: (ctx: { error: AuthError }) => setError(getAuthErrorMessage(ctx.error)),
			};

			try {
				if (identifier.includes("@")) {
					await authClient.signIn.email({ email: identifier, password: value.password, rememberMe: true }, callbacks);
				} else {
					await authClient.signIn.username(
						{ username: identifier, password: value.password, rememberMe: true },
						callbacks,
					);
				}
			} catch (err: unknown) {
				console.error("Unexpected login error:", err);
				setError("Terjadi kesalahan saat login. Silakan coba lagi.");
			}
		},
		validators: {
			onSubmit: type({ identifier: "string > 0", password: "string > 0" }),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="relative w-full max-w-md">
			<div className="absolute left-1/2 z-50 -translate-x-1/2 -translate-y-full">
				<Image src="/images/main-card-kelas.webp" alt="Study Avatar" width={200} height={200} />
			</div>
			<div className="relative z-10 w-full rounded-sm border border-primary/50 bg-white p-8 shadow-lg">
				<div className="flex flex-col items-center gap-2 text-center">
					<h1 className="text-3xl text-primary">
						<span className="font-bold">Selamat Datang </span>
						Kembali
					</h1>
					<p className="text-sm">Masuk kembali untuk memulai belajar lagi!</p>
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
						<form.Field name="identifier">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Username/Email</Label>
									<Input
										id={field.name}
										name={field.name}
										type="text"
										autoComplete="username"
										autoCapitalize="none"
										autoCorrect="off"
										spellCheck={false}
										value={field.state.value}
										onBlur={() => {
											field.handleChange(normalizeIdentifier(field.state.value)); // rapikan tampilan saat blur
											field.handleBlur();
										}}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-xs">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<div>
						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Password</Label>
									<div className="relative">
										<Input
											id={field.name}
											name={field.name}
											type={showPassword ? "text" : "password"}
											autoComplete="current-password"
											autoCapitalize="none"
											autoCorrect="off"
											spellCheck={false}
											className="pr-12"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="absolute top-1/2 right-1 -translate-y-1/2"
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => setShowPassword((p) => !p)}
											aria-pressed={showPassword}
											aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
										>
											{showPassword ? <EyeSlashIcon /> : <EyeIcon />}
										</Button>
									</div>
								</div>
							)}
						</form.Field>
						<Link to="/forgot-password" className="mt-1 ml-auto block w-fit text-primary text-xs underline">
							Lupa Password?
						</Link>
					</div>

					<form.Subscribe>
						{(state) => (
							<Button type="submit" className="w-full" disabled={!state.canSubmit || state.isSubmitting}>
								{state.isSubmitting ? "Memuat..." : "Masuk"}
							</Button>
						)}
					</form.Subscribe>
				</form>

				<div className="flex items-center gap-4 py-4">
					<Separator className="flex-1" />
					<span className="shrink-0 text-muted-foreground text-xs uppercase">atau</span>
					<Separator className="flex-1" />
				</div>

				<Button
					onClick={() => {
						authClient.signIn.social({
							provider: "google",
							callbackURL: `${window.location.origin}/dashboard`,
						});
					}}
					variant="outline"
					className="mt-0 w-full hover:cursor-pointer"
				>
					<GoogleLogoIcon weight="bold" />
					Masuk dengan Google
				</Button>
			</div>

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

			<p className="mt-4 text-center text-sm">
				Belum punya akun?{" "}
				<Link to="/register" className="font-bold text-primary">
					Daftar Sekarang
				</Link>
			</p>
		</div>
	);
}
