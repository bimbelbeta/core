import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminFieldRow } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orpc } from "@/lib/orpc";

interface ProgramDetailsStepProps {
	universityId: number;
	programId: number;
	onSuccess: () => void;
	onBack: () => void;
}

export function ProgramDetailsStep({ universityId, programId, onSuccess, onBack }: ProgramDetailsStepProps) {
	const [tuition, setTuition] = useState("");
	const [capacity, setCapacity] = useState("");
	const [accreditation, setAccreditation] = useState("");
	const [averageScore, setAverageScore] = useState("");

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
			averageScore: averageScore ? Number(averageScore) : undefined,
		});
	};

	return (
		<div className="space-y-3">
			<AdminFieldRow label="Biaya (Rp)" htmlFor="tuition" optional>
				<Input
					id="tuition"
					type="number"
					placeholder="5.000.000"
					value={tuition}
					onChange={(e) => setTuition(e.target.value)}
				/>
			</AdminFieldRow>

			<AdminFieldRow label="Kapasitas" htmlFor="capacity" optional>
				<Input
					id="capacity"
					type="number"
					placeholder="100"
					value={capacity}
					onChange={(e) => setCapacity(e.target.value)}
				/>
			</AdminFieldRow>

			<AdminFieldRow label="Akreditasi" htmlFor="accreditation" optional>
				<Select value={accreditation || undefined} onValueChange={setAccreditation}>
					<SelectTrigger id="accreditation" className="w-full">
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
			</AdminFieldRow>

			<AdminFieldRow label="Skor Rata-rata" htmlFor="averageScore" optional>
				<Input
					id="averageScore"
					type="number"
					placeholder="500"
					value={averageScore}
					onChange={(e) => setAverageScore(e.target.value)}
				/>
			</AdminFieldRow>

			<DialogFooter className="flex-row justify-between gap-2 pt-1">
				<Button size="xs" variant="outline" onClick={onBack} className="mr-auto gap-1.5">
					<ArrowLeftIcon className="size-3.5" />
					Kembali
				</Button>
				<Button size="xs" isPending={isLinking} onClick={handleSubmit} disabled={isLinking}>
					{"Tambah prodi"}
				</Button>
			</DialogFooter>
		</div>
	);
}
