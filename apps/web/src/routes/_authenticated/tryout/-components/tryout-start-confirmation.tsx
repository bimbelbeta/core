import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { type } from "arktype";
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
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";

interface TryoutStartConfirmationProps {
	isPremium: boolean;
	tryoutId: number;
	children: React.ReactNode;
}

const urlSchema = type("string.url");

type DialogStep = "notice" | "submit-url" | "premium";

export function TryoutStartConfirmation({ isPremium, tryoutId, children }: TryoutStartConfirmationProps) {
	const [imageUrl, setImageUrl] = useState("");
	const [errors, setErrors] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [step, setStep] = useState<DialogStep>(isPremium ? "premium" : "notice");
	const router = useRouter();

	const startTryoutMutation = useMutation(
		orpc.tryout.start.mutationOptions({
			onSuccess: () => {
				router.invalidate();
				setIsOpen(false);
			},
		}),
	);

	const handleStart = () => {
		setErrors(null);
		if (isPremium) {
			startTryoutMutation.mutate({ id: tryoutId });
		} else {
			const parsed = urlSchema(imageUrl);
			if (parsed instanceof type.errors) {
				setErrors(parsed.summary);
				return;
			}
			startTryoutMutation.mutate({ id: tryoutId, imageUrl });
		}
	};

	const handleClose = (open: boolean) => {
		if (!open) {
			setIsOpen(false);
			setStep("notice");
			setImageUrl("");
		} else {
			setIsOpen(true);
			setStep("notice");
			setImageUrl("");
		}
	};

	const handleTryoutGratis = () => {
		setStep("submit-url");
	};

	const handleBeliPaket = () => {
		setIsOpen(false);
		router.navigate({ to: "/premium" });
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogTrigger asChild>{children}</DialogTrigger>
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
							<DialogTitle>Link Bukti Pembayaran</DialogTitle>
							<DialogDescription>Untuk melanjutkan, silakan masukkan link bukti pembayaran Anda.</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 pt-4">
							<Input
								type="text"
								placeholder="https://example.com/proof.jpg"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
							/>
							<DialogFooter>
								<Button
									onClick={handleStart}
									disabled={startTryoutMutation.isPending || errors !== null}
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
							{startTryoutMutation.isPending ? "Memproses..." : "Mulai Tryout"}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
