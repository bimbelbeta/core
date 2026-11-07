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
import { Typography } from "@/components/ui/typography";
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
				<Button size="xs">Tambah prodi</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-base">Tambah Program Studi</DialogTitle>
					<DialogDescription className="sr-only">Tambah program studi ke universitas ini.</DialogDescription>

					{/* Step indicator */}
					<div className="flex items-center gap-2 pt-1">
						{STEPS.map((s, i) => {
							const stepNum = i + 1;
							const isActive = step === stepNum;
							const isComplete = step > stepNum;
							return (
								<div key={s.label} className="flex items-center gap-2">
									{i > 0 && <div className={cn("h-px w-4", isComplete ? "bg-primary" : "bg-border")} />}
									<div className="flex items-center gap-1.5">
										<div
											className={cn(
												"flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-all",
												isActive && "bg-primary text-primary-foreground ring-primary/20 ring-2",
												isComplete && "bg-primary text-primary-foreground",
												!isActive && !isComplete && "bg-muted text-muted-foreground",
											)}
										>
											{isComplete ? "✓" : stepNum}
										</div>
										<span
											className={cn(
												"text-meta leading-tight",
												isActive ? "text-foreground font-medium" : "text-muted-foreground",
											)}
										>
											{s.label}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</DialogHeader>

				{step === 1 ? (
					<div>
						{/* Tab switcher */}
						<div className="mb-3 flex gap-2">
							<Button
								variant={activeTab === "search" ? "default" : "outline"}
								size="xs"
								onClick={() => setActiveTab("search")}
								className="gap-1.5"
							>
								<MagnifyingGlassIcon className="size-3.5" />
								Cari Program
							</Button>
							<Button
								variant={activeTab === "create" ? "default" : "outline"}
								size="xs"
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
						<div>
							{/* Selected program indicator */}
							<div className="bg-muted/50 mb-3 flex items-center gap-2.5 rounded-lg border px-3 py-2">
								<div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
									<MagnifyingGlassIcon className="size-3.5" />
								</div>
								<div className="min-w-0 flex-1">
									<Typography variant="body" className="truncate font-medium">
										{selectedProgram.name}
									</Typography>
									<Typography variant="caption">Program studi terpilih</Typography>
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
