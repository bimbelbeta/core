import { SignOutIcon, SpinnerIcon } from "@phosphor-icons/react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLogout } from "@/hooks/use-logout";
import { Button } from "./ui/button";

interface LogoutDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
	const { logout, pending } = useLogout();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Apakah anda yakin ingin keluar?</AlertDialogTitle>
					<AlertDialogDescription>Kamu akan dikeluarkan dan harus login kembali.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Kembali</AlertDialogCancel>
					<Button onClick={logout} disabled={pending} variant="destructive">
						{pending ? (
							<>
								<SpinnerIcon className="animate-spin" />
								Memasak...
							</>
						) : (
							<>
								<SignOutIcon weight="bold" /> Keluar
							</>
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
