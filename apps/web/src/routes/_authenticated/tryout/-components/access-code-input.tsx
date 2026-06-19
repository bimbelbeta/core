import { KeyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccessCodeInputProps {
	onSubmit?: (code: string) => void;
	isLoading?: boolean;
}

export function AccessCodeInput({ onSubmit, isLoading = false }: AccessCodeInputProps) {
	const [accessCode, setAccessCode] = useState("");

	const handleSubmit = () => {
		const code = accessCode.trim();
		if (!code) return;
		onSubmit?.(code);
	};

	return (
		<div className="rounded-lg border bg-muted/20 p-4">
			<div className="mb-2 flex items-center gap-2">
				<KeyIcon size={18} className="text-muted-foreground" />
				<p className="font-medium text-sm">Gunakan Kode Akses</p>
			</div>
			<div className="flex gap-2">
				<Input
					value={accessCode}
					onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
					placeholder="Masukkan kode"
					autoComplete="off"
					disabled={isLoading}
				/>
				<Button onClick={handleSubmit} disabled={isLoading || !accessCode.trim()}>
					{isLoading ? "Memproses..." : "Gunakan"}
				</Button>
			</div>
		</div>
	);
}
