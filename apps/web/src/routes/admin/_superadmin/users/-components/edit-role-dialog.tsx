import { ROLES, type Role } from "@bimbelbeta/contract/common/roles";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orpc } from "@/utils/orpc";

interface EditRoleDialogProps {
	userId: string;
	userName: string;
	currentRole: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function EditRoleDialog({ userId, userName, currentRole, open, onOpenChange, onSuccess }: EditRoleDialogProps) {
	const [role, setRole] = useState<Role>((currentRole as Role) ?? ROLES.USER);

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
				if (!value) setRole((currentRole as Role) ?? ROLES.USER);
				onOpenChange(value);
			}}
		>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<PencilSimpleIcon className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Edit Role</DialogTitle>
					<DialogDescription>Ubah role untuk user "{userName}"</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">
					<div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2.5">
						<span className="text-muted-foreground text-sm">Role saat ini</span>
						<Badge variant="outline">{currentRole ?? "user"}</Badge>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Role baru</Label>
						<Select value={role} onValueChange={(val) => setRole(val as typeof role)}>
							<SelectTrigger>
								<SelectValue placeholder="Pilih role" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ROLES.USER}>User</SelectItem>
								<SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
								<SelectItem value={ROLES.SUPER_ADMIN}>Superadmin</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={() => updateMutation.mutate({ userId, role })}
						disabled={updateMutation.isPending || role === currentRole}
					>
						{updateMutation.isPending ? "Menyimpan..." : "Simpan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
