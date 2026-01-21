import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orpc } from "@/utils/orpc";

interface ProgramDetailsStepProps {
	universityId: number;
	programId: number;
	programName: string;
	onSuccess: () => void;
	onBack: () => void;
}

export function ProgramDetailsStep({
	universityId,
	programId,
	programName,
	onSuccess,
	onBack,
}: ProgramDetailsStepProps) {
	const [tuition, setTuition] = useState("");
	const [capacity, setCapacity] = useState("");
	const [accreditation, setAccreditation] = useState("");

	const { mutate: linkProgram, isPending: isLinking } = useMutation(
		orpc.admin.university.universityPrograms.create.mutationOptions({
			onSuccess: () => {
				toast.success("Program studi berhasil ditambahkan ke universitas");
				onSuccess();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const handleSubmit = () => {
		linkProgram({
			universityId,
			studyProgramId: programId,
			tuition: tuition ? Number(tuition) : undefined,
			capacity: capacity ? Number(capacity) : undefined,
			accreditation: accreditation || undefined,
		});
	};

	return (
		<div className="grid gap-4 py-4">
			<div className="rounded-lg bg-muted p-3">
				<p className="font-medium text-sm">{programName}</p>
			</div>
			<div className="grid gap-4">
				<div className="grid grid-cols-4 items-center gap-4">
					<Label htmlFor="tuition" className="text-right font-medium text-sm">
						Biaya
					</Label>
					<Input
						id="tuition"
						type="number"
						placeholder="Contoh: 5000000"
						value={tuition}
						onChange={(e) => setTuition(e.target.value)}
						className="col-span-3"
					/>
				</div>
				<div className="grid grid-cols-4 items-center gap-4">
					<Label htmlFor="capacity" className="text-right font-medium text-sm">
						Kapasitas
					</Label>
					<Input
						id="capacity"
						type="number"
						placeholder="Contoh: 100"
						value={capacity}
						onChange={(e) => setCapacity(e.target.value)}
						className="col-span-3"
					/>
				</div>
				<div className="grid grid-cols-4 items-center gap-4">
					<Label htmlFor="accreditation" className="text-right font-medium text-sm">
						Akreditasi
					</Label>
					<Select value={accreditation} onValueChange={setAccreditation}>
						<SelectTrigger className="col-span-3">
							<SelectValue placeholder="Pilih..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Unggul">Unggul</SelectItem>
							<SelectItem value="A">A</SelectItem>
							<SelectItem value="B">B</SelectItem>
							<SelectItem value="C">C</SelectItem>
							<SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
							<SelectItem value="Baik">Baik</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<DialogFooter className="justify-between">
				<Button variant="ghost" onClick={onBack}>
					Kembali
				</Button>
				<Button onClick={handleSubmit} disabled={isLinking}>
					{isLinking ? "Menambahkan..." : "Tambah Prodi"}
				</Button>
			</DialogFooter>
		</div>
	);
}
