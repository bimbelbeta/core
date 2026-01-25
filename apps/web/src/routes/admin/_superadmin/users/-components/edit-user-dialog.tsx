import { PencilSimpleIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import type { BodyOutputs } from "@/utils/orpc";
import { orpc } from "@/utils/orpc";

interface EditUserDialogProps {
	user: NonNullable<BodyOutputs["admin"]["users"]["getUser"]["user"]>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
	const form = useForm({
		defaultValues: {
			role: (user.role ?? "user") as "user" | "admin" | "superadmin",
			isPremium: user.isPremium ?? false,
			premiumExpiresAt: user.premiumExpiresAt ? new Date(user.premiumExpiresAt).toISOString().slice(0, 16) : undefined,
		},
		onSubmit: async ({ value }) => {
			updateMutation.mutate({
				userId: user.id,
				role: value.role,
				isPremium: value.isPremium,
				premiumExpiresAt: value.isPremium && value.premiumExpiresAt ? value.premiumExpiresAt : undefined,
			});
		},
		validators: {
			onChange: type({
				role: "'user' | 'admin' | 'superadmin'",
				isPremium: "boolean",
				premiumExpiresAt: "string?",
			}),
		},
	});

	const updateMutation = useMutation(
		orpc.admin.users.updateUser.mutationOptions({
			onSuccess: () => {
				toast.success("User berhasil diperbarui");
				form.reset();
				onSuccess();
				onOpenChange(false);
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<PencilSimpleIcon className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-125">
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>
						Ubah role dan status premium untuk user "{user.name}" ({user.email})
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4"
				>
					<div className="grid gap-4 py-4">
						<form.Field name="role">
							{(field) => (
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor={field.name} className="text-right">
										Role
									</Label>
									<div className="col-span-3">
										<Select
											value={field.state.value}
											onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Pilih role" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="user">User</SelectItem>
												<SelectItem value="admin">Admin</SelectItem>
												<SelectItem value="superadmin">Superadmin</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							)}
						</form.Field>

						<form.Field name="isPremium">
							{(field) => (
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor={field.name} className="text-right">
										Premium
									</Label>
									<div className="col-span-3 flex items-center gap-2">
										<Switch
											id={field.name}
											checked={field.state.value}
											onCheckedChange={(checked) => field.handleChange(checked)}
										/>
										<span className="text-muted-foreground text-sm">{field.state.value ? "Aktif" : "Nonaktif"}</span>
									</div>
								</div>
							)}
						</form.Field>

						<form.Field name="premiumExpiresAt">
							{(field) => (
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor={field.name} className="text-right">
										Expired Premium
									</Label>
									<input
										id={field.name}
										type="datetime-local"
										value={field.state.value}
										disabled={!form.getFieldValue("isPremium")}
										onChange={(e) => field.handleChange(e.target.value)}
										className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									/>
								</div>
							)}
						</form.Field>
					</div>

					<DialogFooter>
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
