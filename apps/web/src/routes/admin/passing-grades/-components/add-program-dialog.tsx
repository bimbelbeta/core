import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateProgramTab } from "./create-program-tab";
import { ProgramDetailsStep } from "./program-details-step";
import { SearchProgramTab } from "./search-program-tab";

interface AddProgramDialogProps {
	universityId: number;
	onSuccess: () => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddProgramDialog({ universityId, onSuccess, open, onOpenChange }: AddProgramDialogProps) {
	const [step, setStep] = useState<1 | 2>(1);
	const [activeTab, setActiveTab] = useState<"search" | "create">("search");
	const [selectedProgram, setSelectedProgram] = useState<{ id: number; name: string } | null>(null);

	const handleOpenChange = (isOpen: boolean) => {
		onOpenChange(isOpen);
		if (!isOpen) {
			setStep(1);
			setActiveTab("search");
			setSelectedProgram(null);
		}
	};

	const handleProgramSelect = (program: { id: number; name: string }) => {
		setSelectedProgram(program);
		setStep(2);
	};

	const handleProgramCreate = (program: { id: number; name: string }) => {
		setSelectedProgram(program);
		setStep(2);
	};

	const handleBack = () => {
		setStep(1);
	};

	const handleSuccess = () => {
		onSuccess();
		onOpenChange(false);
		setStep(1);
		setActiveTab("search");
		setSelectedProgram(null);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className="mr-2 size-4" />
					Tambah Prodi
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Tambah Program Studi</DialogTitle>
					<DialogDescription className="flex items-center gap-2">
						{step === 1 ? (
							<>
								<span className="text-muted-foreground">Langkah 1 dari 2</span>
								<span>• Cari program studi yang ada atau buat baru untuk universitas ini.</span>
							</>
						) : (
							<>
								<span className="text-muted-foreground">Langkah 2 dari 2</span>
								<span>• Tambah detail untuk program studi ini.</span>
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				{step === 1 ? (
					<Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "search" | "create")} className="w-full">
						<TabsList>
							<TabsTrigger value="search">Cari Program</TabsTrigger>
							<TabsTrigger value="create">Buat Baru</TabsTrigger>
						</TabsList>

						<TabsContent value="search">
							<SearchProgramTab onProgramSelect={handleProgramSelect} />
						</TabsContent>

						<TabsContent value="create">
							<CreateProgramTab onProgramCreate={handleProgramCreate} />
						</TabsContent>
					</Tabs>
				) : (
					selectedProgram && (
						<ProgramDetailsStep
							universityId={universityId}
							programId={selectedProgram.id}
							programName={selectedProgram.name}
							onSuccess={handleSuccess}
							onBack={handleBack}
						/>
					)
				)}
			</DialogContent>
		</Dialog>
	);
}
