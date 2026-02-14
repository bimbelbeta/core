import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CreateProgramTab } from "./create-program-tab";
import { ProgramDetailsStep } from "./program-details-step";
import { SearchProgramTab } from "./search-program-tab";

interface AddProgramDialogProps {
	universityId: number;
	onSuccess: () => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const STEPS = [
	{ label: "Pilih Program", description: "Cari atau buat program studi baru" },
	{ label: "Detail", description: "Lengkapi data universitas untuk program ini" },
] as const;

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
			<DialogContent className="gap-0 p-0 sm:max-w-[540px]">
				<DialogHeader className="px-6 pt-6 pb-4">
					<DialogTitle>Tambah Program Studi</DialogTitle>
					<DialogDescription className="sr-only">Tambah program studi ke universitas ini.</DialogDescription>

					{/* Step indicator */}
					<div className="flex items-center gap-3 pt-2">
						{STEPS.map((s, i) => {
							const stepNum = i + 1;
							const isActive = step === stepNum;
							const isComplete = step > stepNum;
							return (
								<div key={s.label} className="flex items-center gap-2">
									{i > 0 && (
										<div className={cn("h-px w-6 transition-colors", isComplete ? "bg-primary" : "bg-border")} />
									)}
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-xs transition-all",
												isActive && "bg-primary text-primary-foreground ring-2 ring-primary/20",
												isComplete && "bg-primary text-primary-foreground",
												!isActive && !isComplete && "bg-muted text-muted-foreground",
											)}
										>
											{isComplete ? "✓" : stepNum}
										</div>
										<div className="flex flex-col">
											<span
												className={cn(
													"text-sm leading-tight",
													isActive ? "font-medium text-foreground" : "text-muted-foreground",
												)}
											>
												{s.label}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</DialogHeader>

				<div className="border-t" />

				{step === 1 ? (
					<div className="px-6 py-5">
						{/* Tab switcher */}
						<div className="mb-4 flex gap-2">
							<Button
								variant={activeTab === "search" ? "default" : "outline"}
								size="sm"
								onClick={() => setActiveTab("search")}
								className="gap-1.5"
							>
								<MagnifyingGlassIcon className="size-3.5" />
								Cari Program
							</Button>
							<Button
								variant={activeTab === "create" ? "default" : "outline"}
								size="sm"
								onClick={() => setActiveTab("create")}
								className="gap-1.5"
							>
								<PlusIcon className="size-3.5" />
								Buat Baru
							</Button>
						</div>

						{activeTab === "search" ? (
							<SearchProgramTab onProgramSelect={handleProgramSelect} />
						) : (
							<CreateProgramTab onProgramCreate={handleProgramCreate} />
						)}
					</div>
				) : (
					selectedProgram && (
						<div className="px-6 py-5">
							{/* Selected program indicator */}
							<div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
									<MagnifyingGlassIcon className="size-4" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">{selectedProgram.name}</p>
									<p className="text-muted-foreground text-xs">Program studi terpilih</p>
								</div>
								<Badge variant="outline" className="shrink-0">
									Langkah 2
								</Badge>
							</div>

							<ProgramDetailsStep
								universityId={universityId}
								programId={selectedProgram.id}
								onSuccess={handleSuccess}
								onBack={handleBack}
							/>
						</div>
					)
				)}
			</DialogContent>
		</Dialog>
	);
}
