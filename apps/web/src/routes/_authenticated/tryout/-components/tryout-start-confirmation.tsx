import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { type } from "arktype";
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

export function TryoutStartConfirmation({ isPremium, tryoutId, children }: TryoutStartConfirmationProps) {
	const [imageUrl, setImageUrl] = useState("");
	const [isOpen, setIsOpen] = useState(false);
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
		if (isPremium) {
			startTryoutMutation.mutate({ id: tryoutId });
		} else {
			const parsed = urlSchema(imageUrl);
			if (parsed instanceof type.errors) {
				alert(`Invalid URL: ${parsed.summary}`);
				return;
			}
			startTryoutMutation.mutate({ id: tryoutId, imageUrl });
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				{!isPremium ? (
					<>
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
								<Button onClick={handleStart} disabled={startTryoutMutation.isPending} className="w-full">
									{startTryoutMutation.isPending ? "Memproses..." : "Mulai Tryout"}
								</Button>
							</DialogFooter>
						</div>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Mulai Tryout</DialogTitle>
							<DialogDescription>
								Waktu akan berjalan ketika Anda menekan tombol &lsquo;Mulai&rsquo;. Pastikan Anda sudah siap.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="pt-4">
							<Button onClick={handleStart} disabled={startTryoutMutation.isPending} className="w-full">
								{startTryoutMutation.isPending ? "Memulai..." : "Mulai"}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
