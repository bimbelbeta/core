import { useUploadFile } from "@better-upload/client";
import { UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { getApiUrl } from "@/lib/orpc";
import { cn } from "@/lib/utils";

interface UploadPaymentProofProps {
	onUploadComplete?: (url: string) => void;
	onError?: (error: { message: string }) => void;
	onRemove?: () => void;
	disabled?: boolean;
}

export function UploadPaymentProof({ onUploadComplete, onError, onRemove, disabled = false }: UploadPaymentProofProps) {
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

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
			setUploadedUrl(file.objectInfo.key);
			setError(null);
			onUploadComplete?.(file.objectInfo.key);
		},
		onError: (err) => {
			setError(err.message);
			setPreviewUrl(null);
			onError?.(err);
		},
	});

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			setPreviewUrl(objectUrl);
			setError(null);
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
		onRemove?.();
	};

	const isComplete = uploadedUrl && !isUploading;

	return (
		<div className="space-y-2">
			{!previewUrl ? (
				<label
					className={cn(
						"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
						"hover:border-primary hover:bg-muted/50",
						(isUploading || disabled) && "pointer-events-none opacity-50",
					)}
				>
					<UploadSimpleIcon className="text-muted-foreground size-8" />
					<span className="text-muted-foreground text-sm">Klik untuk memilih gambar atau drag & drop</span>
					<span className="text-muted-foreground text-xs">PNG, JPG, GIF (maks 2MB)</span>
					<input
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleFileSelect}
						disabled={isUploading || disabled}
					/>
				</label>
			) : (
				<div className="relative">
					<div className="relative overflow-hidden rounded-lg border">
						<img src={previewUrl} alt="Preview bukti pembayaran" className="h-48 w-full object-cover" />
						{!isUploading && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Hapus bukti pembayaran"
								onClick={handleRemoveFile}
								className="bg-background/80 hover:bg-background absolute top-2 right-2 rounded-full"
							>
								<XIcon className="size-4" />
							</Button>
						)}
						{isUploading && (
							<div className="bg-background/60 absolute inset-0 flex items-center justify-center">
								<div className="flex flex-col items-center gap-2">
									<Spinner />
									<span className="text-sm font-medium">{Math.round(progress * 100)}%</span>
								</div>
							</div>
						)}
					</div>
					{isUploading && (
						<div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
							<div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress * 100}%` }} />
						</div>
					)}
					{isComplete && <Typography className="mt-2 text-center text-green-600">Upload berhasil!</Typography>}
				</div>
			)}
			{error && <Typography tone="destructive">{error}</Typography>}
		</div>
	);
}
