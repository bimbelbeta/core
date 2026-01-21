import { ArrowLeftIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/passing-grades/$universityId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { universityId } = Route.useParams();
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	const { data: university, isLoading: isUniversityLoading } = useQuery(
		orpc.admin.university.universities.find.queryOptions({
			input: {
				id: Number(universityId),
			},
		}),
	);

	const {
		data: programs,
		isLoading: isProgramsLoading,
		refetch: refetchPrograms,
	} = useQuery(
		orpc.admin.university.universityPrograms.list.queryOptions({
			input: {
				universityId: Number(universityId),
				limit: 100,
			},
		}),
	);

	if (isUniversityLoading) {
		return <div className="p-6">Loading...</div>;
	}

	if (!university) {
		return <div className="p-6">University not found</div>;
	}

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link to="/admin/passing-grades">
						<ArrowLeftIcon className="size-5" />
					</Link>
				</Button>
				<div className="flex flex-col">
					<h1 className="font-bold text-2xl text-primary-navy-900">{university.name}</h1>
					<span className="text-muted-foreground">{university.location}</span>
				</div>
			</div>

			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Study Programs</h2>
				<AddProgramDialog
					universityId={Number(universityId)}
					onSuccess={() => {
						setIsAddDialogOpen(false);
						refetchPrograms();
					}}
					open={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
				/>
			</div>

			<div className="rounded-lg border bg-white shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>No</TableHead>
							<TableHead>Program Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Tuition</TableHead>
							<TableHead>Capacity</TableHead>
							<TableHead>Accreditation</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isProgramsLoading ? (
							<TableRow>
								<TableCell colSpan={7} className="h-24 text-center">
									Loading programs...
								</TableCell>
							</TableRow>
						) : programs?.data?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
									No study programs linked yet.
								</TableCell>
							</TableRow>
						) : (
							programs?.data?.map((prog, index) => (
								<TableRow key={prog.id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className="font-medium">{prog.studyProgram.name}</TableCell>
									<TableCell>{prog.studyProgram.category}</TableCell>
									<TableCell>{prog.tuition ? `Rp ${prog.tuition.toLocaleString("id-ID")}` : "-"}</TableCell>
									<TableCell>{prog.capacity ?? "-"}</TableCell>
									<TableCell>{prog.accreditation ?? "-"}</TableCell>
									<TableCell>
										<Badge variant={prog.isActive ? "default" : "secondary"}>
											{prog.isActive ? "Active" : "Inactive"}
										</Badge>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function AddProgramDialog({
	universityId,
	onSuccess,
	open,
	onOpenChange,
}: {
	universityId: number;
	onSuccess: () => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [step, setStep] = useState<"search" | "details">("search");
	const [searchProgram, setSearchProgram] = useState("");
	const [selectedProgram, setSelectedProgram] = useState<{ id: number; name: string } | null>(null);

	const [tuition, setTuition] = useState("");
	const [capacity, setCapacity] = useState("");
	const [accreditation, setAccreditation] = useState("");

	const { data: searchResults, isLoading: isSearchLoading } = useQuery({
		...orpc.admin.university.studyPrograms.list.queryOptions({
			input: {
				search: searchProgram,
				limit: 5,
			},
		}),
		enabled: open && step === "search" && searchProgram.length > 0,
	});

	const { mutate: createProgram, isPending: isCreating } = useMutation(
		orpc.admin.university.universityPrograms.create.mutationOptions({
			onSuccess: () => {
				toast.success("Study program added successfully");
				onSuccess();
				resetForm();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	const resetForm = () => {
		setStep("search");
		setSearchProgram("");
		setSelectedProgram(null);
		setTuition("");
		setCapacity("");
		setAccreditation("");
	};

	const handleSelectProgram = (prog: { id: number; name: string }) => {
		setSelectedProgram(prog);
		setStep("details");
	};

	const handleSubmit = () => {
		if (!selectedProgram) return;

		createProgram({
			universityId,
			studyProgramId: selectedProgram.id,
			tuition: tuition ? Number(tuition) : undefined,
			capacity: capacity ? Number(capacity) : undefined,
			accreditation: accreditation || undefined,
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				onOpenChange(val);
				if (!val) resetForm();
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className="mr-2 size-4" />
					Add Program
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Study Program</DialogTitle>
					<DialogDescription>
						{step === "search"
							? "Search for a study program to add to this university."
							: `Add details for ${selectedProgram?.name}`}
					</DialogDescription>
				</DialogHeader>

				{step === "search" ? (
					<div className="grid gap-4 py-4">
						<SearchInput
							value={searchProgram}
							onChange={setSearchProgram}
							placeholder="Search study program..."
							autoFocus
						/>
						<div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
							{isSearchLoading ? (
								<p className="p-2 text-center text-muted-foreground text-sm">Searching...</p>
							) : searchResults?.data?.length === 0 ? (
								<p className="p-2 text-center text-muted-foreground text-sm">No programs found.</p>
							) : (
								searchResults?.data?.map((prog) => (
									<Button
										key={prog.id}
										variant="outline"
										className="h-auto justify-start py-3 text-left"
										onClick={() => handleSelectProgram({ id: prog.id, name: prog.name })}
									>
										<div className="flex flex-col">
											<span className="font-medium">{prog.name}</span>
											<span className="text-muted-foreground text-xs">{prog.category}</span>
										</div>
									</Button>
								))
							)}
							{!searchProgram && (
								<p className="p-2 text-center text-muted-foreground text-sm">Type to search programs.</p>
							)}
						</div>
					</div>
				) : (
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="tuition" className="text-right font-medium text-sm">
								Tuition
							</label>
							<Input
								id="tuition"
								type="number"
								placeholder="Example: 5000000"
								value={tuition}
								onChange={(e) => setTuition(e.target.value)}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="capacity" className="text-right font-medium text-sm">
								Capacity
							</label>
							<Input
								id="capacity"
								type="number"
								placeholder="Example: 100"
								value={capacity}
								onChange={(e) => setCapacity(e.target.value)}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<label htmlFor="accreditation" className="text-right font-medium text-sm">
								Accreditation
							</label>
							<Select value={accreditation} onValueChange={setAccreditation}>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="Select..." />
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
				)}

				<DialogFooter>
					{step === "details" && (
						<div className="flex w-full justify-between">
							<Button variant="ghost" onClick={() => setStep("search")}>
								Back
							</Button>
							<Button onClick={handleSubmit} disabled={isCreating}>
								{isCreating ? "Adding..." : "Add Program"}
							</Button>
						</div>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
