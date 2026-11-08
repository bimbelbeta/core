import { ROLES, type Role } from "@bimbelbeta/contract/common/roles";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orpc } from "@/lib/orpc";
import { isValidRole } from "../-utils";

interface EditRoleDialogProps {
	userId: string;
	userName: string;
	currentRole: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function EditRoleDialog({ userId, userName, currentRole, open, onOpenChange, onSuccess }: EditRoleDialogProps) {
	const [role, setRole] = useState<Role>(isValidRole(currentRole) ? currentRole : ROLES.USER);

	const updateMutation = useMutation(
		orpc.admin.users.update.mutationOptions({
			onSuccess: () => {
				toast.success("Role berhasil diperbarui");
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) setRole(isValidRole(currentRole) ? currentRole : ROLES.USER);
				onOpenChange(value);
			}}
		>
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle className="text-base">Edit Role</DialogTitle>
					<DialogDescription>Ubah role untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<AdminFieldRow label="Role baru" htmlFor="edit-role" hint={`Saat ini ${currentRole ?? "user"}`}>
					<Select
						value={role}
						onValueChange={(val) => {
							if (isValidRole(val)) setRole(val);
						}}
					>
						<SelectTrigger id="edit-role" className="w-full">
							<SelectValue placeholder="Pilih role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ROLES.USER}>User</SelectItem>
							<SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
							<SelectItem value={ROLES.SUPER_ADMIN}>Superadmin</SelectItem>
						</SelectContent>
					</Select>
				</AdminFieldRow>
				<DialogFooter>
					<Button
						size="xs"
						isPending={updateMutation.isPending}
						onClick={() => updateMutation.mutate({ userId, role })}
						disabled={updateMutation.isPending || role === currentRole}
					>
						{"Simpan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
