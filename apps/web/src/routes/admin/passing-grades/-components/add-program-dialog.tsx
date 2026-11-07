import { MagnifyingGlassIcon } from "@phosphor-icons/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const STEPS = ["Pilih Program", "Detail"] as const;

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
			<DialogContent size="lg" className="flex max-h-[85vh] flex-col">
				<DialogHeader>
					<DialogTitle className="text-base">Tambah Program Studi</DialogTitle>
					<DialogDescription className="sr-only">Tambah program studi ke universitas ini.</DialogDescription>

					<div className="flex flex-col gap-1 pt-1 pb-1">
						<div className="flex items-baseline justify-between gap-2">
							<Typography variant="caption">
								Langkah {step} dari {STEPS.length}
							</Typography>
							<Typography variant="caption" className="text-foreground font-medium">
								{STEPS[step - 1]}
							</Typography>
						</div>
						<div className="flex gap-1">
							{STEPS.map((label, i) => (
								<div
									key={label}
									className={cn("h-1 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : "bg-muted")}
								/>
							))}
						</div>
					</div>
				</DialogHeader>

				{step === 1 ? (
					<Tabs
						value={activeTab}
						onValueChange={(value) => setActiveTab(value === "create" ? "create" : "search")}
						className="flex min-h-0 flex-1 flex-col gap-4"
					>
						<TabsList className="shrink-0">
							<TabsTrigger value="search">Cari Program</TabsTrigger>
							<TabsTrigger value="create">Buat Baru</TabsTrigger>
						</TabsList>
						<TabsContent value="search" className="flex min-h-0 flex-1 flex-col">
							<SearchProgramTab onProgramSelect={handleProgramSelect} />
						</TabsContent>
						<TabsContent value="create" className="min-h-0 flex-1 overflow-y-auto">
							<CreateProgramTab onProgramCreate={handleProgramSelect} />
						</TabsContent>
					</Tabs>
				) : (
					selectedProgram && (
						<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
							<div className="bg-muted/50 flex items-center gap-2.5 rounded-lg border px-3 py-2">
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
