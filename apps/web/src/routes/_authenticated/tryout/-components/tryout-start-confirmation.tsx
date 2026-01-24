import { useUploadFile } from "@better-upload/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Upload, X } from "lucide-react";
import * as m from "motion/react-m";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getApiUrl, orpc } from "@/utils/orpc";

interface TryoutStartConfirmationProps {
	children: React.ReactNode;
	disabled?: boolean;
}

type DialogStep = "notice" | "submit-url" | "premium";

export function TryoutStartConfirmation({ children, disabled = false }: TryoutStartConfirmationProps) {
	const { session } = useRouteContext({ from: "/_authenticated" });
	const isPremium = session?.user.isPremium;

	const { data } = useQuery(orpc.tryout.featured.queryOptions());

	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [errors, setErrors] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [step, setStep] = useState<DialogStep>(isPremium ? "premium" : "notice");
	const router = useRouter();

	const {
		upload,
		progress,
		isPending: isUploading,
		reset: resetUpload,
	} = useUploadFile({
		route: "tryout",
		api: `${getApiUrl()}/upload`,
		credentials: "include",
		onUploadComplete: ({ file }) => {
			// Construct URL from the S3 object key
			const s3Host = "http://s3-gw848o8k8o40wog4o0sgcs0w.15.235.206.134.sslip.io";
			const bucket = "temp";
			const url = `${s3Host}/${bucket}/${file.objectInfo.key}`;
			setUploadedUrl(url);
			setErrors(null);
		},
		onError: (error) => {
			setErrors(error.message);
			setPreviewUrl(null);
		},
	});

	const startTryoutMutation = useMutation(
		orpc.tryout.start.mutationOptions({
			onSuccess: () => {
				setIsOpen(false);
				if (data) router.navigate({ to: "/tryout/$tryoutId", params: { tryoutId: data?.id.toString() } });
			},
		}),
	);
	if (!data) return null;

	const handleStart = () => {
		setErrors(null);
		if (isPremium) {
			startTryoutMutation.mutate({ id: data.id });
		} else {
			if (!uploadedUrl) {
				setErrors("Silakan upload bukti pembayaran terlebih dahulu");
				return;
			}
			startTryoutMutation.mutate({ id: data.id, imageUrl: uploadedUrl });
		}
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setStep(isPremium ? "premium" : "notice");
			setUploadedUrl(null);
			setPreviewUrl(null);
			setErrors(null);
			resetUpload();
		}
	};

	const handleTryoutGratis = () => {
		setStep("submit-url");
	};

	const handleBeliPaket = () => {
		setIsOpen(false);
		router.navigate({ to: "/premium" });
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Create preview URL
			const objectUrl = URL.createObjectURL(file);
			setPreviewUrl(objectUrl);
			setErrors(null);
			// Start upload
			upload(file);
		}
		e.target.value = "";
	};

	const handleRemoveFile = () => {
		setUploadedUrl(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
		resetUpload();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild disabled={disabled}>
				{children}
			</DialogTrigger>
			<DialogContent>
				{step === "premium" ? (
					<DialogHeader>
						<DialogTitle>Mulai Tryout</DialogTitle>
						<DialogDescription>Kamu siap memulai tryout ini.</DialogDescription>
					</DialogHeader>
				) : step === "notice" ? (
					<m.div
						key="notice"
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
					>
						<DialogHeader>
							<DialogTitle>Ups, kamu belum premium</DialogTitle>
							<DialogDescription>
								Untuk mencoba tryout premium, kamu perlu mengupgrade ke paket premium terlebih dahulu.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 pt-4">
							<DialogFooter className="flex flex-col gap-3 sm:flex-col">
								<Button onClick={handleTryoutGratis} className="w-full">
									Tryout Gratis
								</Button>
								<Button variant="outline" onClick={handleBeliPaket} className="w-full">
									Beli Paket
								</Button>
							</DialogFooter>
						</div>
					</m.div>
				) : (
					<m.div
						key="submit-url"
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
					>
						<DialogHeader>
							<DialogTitle>Upload Bukti Pembayaran</DialogTitle>
							<DialogDescription>
								Untuk melanjutkan, silakan upload bukti pembayaran Anda (maksimal 2MB).
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 pt-4">
							{/* Upload area */}
							{!previewUrl ? (
								<label
									className={cn(
										"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
										"hover:border-primary hover:bg-muted/50",
										isUploading && "pointer-events-none opacity-50",
									)}
								>
									<Upload className="size-8 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">Klik untuk memilih gambar atau drag & drop</span>
									<span className="text-muted-foreground text-xs">PNG, JPG, GIF (maks 2MB)</span>
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleFileSelect}
										disabled={isUploading}
									/>
								</label>
							) : (
								<div className="relative">
									{/* Image preview */}
									<div className="relative overflow-hidden rounded-lg border">
										<img src={previewUrl} alt="Preview bukti pembayaran" className="h-48 w-full object-cover" />
										{/* Remove button */}
										{!isUploading && (
											<button
												type="button"
												onClick={handleRemoveFile}
												className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background"
											>
												<X className="size-4" />
											</button>
										)}
										{/* Progress overlay */}
										{isUploading && (
											<div className="absolute inset-0 flex items-center justify-center bg-background/60">
												<div className="flex flex-col items-center gap-2">
													<Spinner />
													<span className="font-medium text-sm">{Math.round(progress * 100)}%</span>
												</div>
											</div>
										)}
									</div>
									{/* Progress bar */}
									{isUploading && (
										<div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full bg-primary transition-all duration-300"
												style={{ width: `${progress * 100}%` }}
											/>
										</div>
									)}
									{/* Success indicator */}
									{uploadedUrl && !isUploading && (
										<p className="mt-2 text-center text-green-600 text-sm">Upload berhasil!</p>
									)}
								</div>
							)}
							{errors && <p className="text-destructive text-sm">{errors}</p>}
							<DialogFooter>
								<Button
									onClick={handleStart}
									disabled={startTryoutMutation.isPending || isUploading || !uploadedUrl}
									className="w-full"
								>
									{startTryoutMutation.isPending ? "Memproses..." : "Mulai Tryout"}
								</Button>
							</DialogFooter>
						</div>
					</m.div>
				)}
				{step === "premium" && (
					<DialogFooter>
						<Button onClick={handleStart} disabled={startTryoutMutation.isPending} className="w-full">
							{startTryoutMutation.isPending ? (
								<>
									<Spinner /> Memulai...
								</>
							) : (
								"Mulai Tryout"
							)}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
