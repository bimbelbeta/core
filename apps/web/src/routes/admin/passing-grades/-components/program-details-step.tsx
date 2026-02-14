import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="tuition" className="font-medium text-sm">
						Biaya (Rp)
					</Label>
					<Input
						id="tuition"
						type="number"
						placeholder="5.000.000"
						value={tuition}
						onChange={(e) => setTuition(e.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="capacity" className="font-medium text-sm">
						Kapasitas
					</Label>
					<Input
						id="capacity"
						type="number"
						placeholder="100"
						value={capacity}
						onChange={(e) => setCapacity(e.target.value)}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="accreditation" className="font-medium text-sm">
						Akreditasi
					</Label>
					<Select value={accreditation} onValueChange={setAccreditation}>
						<SelectTrigger>
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
				<div className="space-y-1.5">
					<Label htmlFor="averageScore" className="font-medium text-sm">
						Skor Rata-rata
					</Label>
					<Input
						id="averageScore"
						type="number"
						placeholder="500"
						value={averageScore}
						onChange={(e) => setAverageScore(e.target.value)}
					/>
				</div>
			</div>

			<DialogFooter className="flex-row justify-between gap-2 pt-2">
				<Button variant="outline" onClick={onBack} className="gap-1.5 mr-auto">
					<ArrowLeftIcon className="size-3.5" />
					Kembali
				</Button>
				<Button onClick={handleSubmit} disabled={isLinking}>
					{isLinking ? (
						<>
							<Spinner />
							Menambahkan...
						</>
					) : (
						"Tambah Prodi"
					)}
				</Button>
			</DialogFooter>
		</div>
	);
}
