import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface PremiumGateModalProps {
	isOpen: boolean;
	onClose: () => void;
	contentType?: "content" | "subject" | "tryout";
}

export function PremiumGateModal({ isOpen, onClose, contentType = "content" }: PremiumGateModalProps) {
	const navigate = useNavigate();

	const contentTypeLabels = {
		content: "materi ini",
		subject: "subjek ini",
		tryout: "tryout ini",
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Ups, belum premium!</DialogTitle>
					<DialogDescription>
						Maaf, Anda perlu berlangganan premium untuk mengakses {contentTypeLabels[contentType]}.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Kembali
					</Button>
					<Button onClick={() => navigate({ to: "/premium" })}>Lihat Paket Premium</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
