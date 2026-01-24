import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import ErrorComponent from "@/components/error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/tryout/results/$attemptId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { attemptId } = Route.useParams();
	const navigate = useNavigate();
	const session = authClient.useSession();
	const [showPremiumDialog, setShowPremiumDialog] = useState(false);

	const { data, isPending, error } = useQuery(
		orpc.tryout.attemptResult.queryOptions({
			input: { attemptId: Number(attemptId) },
		}),
	);

	if (isPending) {
		return (
			<div className="flex flex-col gap-8">
				<div className="space-y-4">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-64" />
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Skeleton className="h-48" />
					<Skeleton className="h-48" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-96 w-full" />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return <ErrorComponent error={error} />;
	}

	const subtestScores = new Map(data.subtestAttempts.map((sa) => [sa.subtestId, sa.score]));

	const passingGrade = data.tryout.passingGrade;
	const isPassed = (data.score ?? 0) >= passingGrade;

	return (
		<div className="flex flex-col gap-8">
			{/* Header Section */}
			<div className="space-y-6">
				<Button variant="default" className="bg-[#009CA6] hover:bg-[#008a93]" asChild>
					<Link to="/tryout" search={{ tab: "results" }}>
						<ArrowLeftIcon className="mr-2 size-4" />
						Kembali
					</Link>
				</Button>

				<h1 className="font-semibold text-3xl">Berikut Hasil Tryoutmu!</h1>
			</div>

			{/* Score Cards */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Score */}
				<Card className="border-blue-100 bg-blue-50/50">
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">Skor</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2">
							<span className="font-semibold text-5xl text-blue-600">{data.score ?? 0}</span>
							<span className="font-medium text-muted-foreground text-xl">/ 1000</span>
						</div>
					</CardContent>
				</Card>

				{/* Passing Grade */}
				<Card className="relative overflow-hidden border-green-100 bg-green-50/50">
					<CardHeader className="flex items-center justify-between gap-2 pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">Passing Grade</CardTitle>
						<Badge
							variant="secondary"
							className={cn(
								isPassed ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600",
							)}
						>
							{isPassed ? "Lulus" : "Tidak Lulus"}
						</Badge>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-2">
							<span className={cn("font-semibold text-5xl", isPassed ? "text-green-600" : "text-red-500")}>
								{passingGrade}
							</span>
							<span className="font-medium text-muted-foreground text-xl">/ 1000</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Details Section */}
			<div className="space-y-6">
				<div className="space-y-1">
					<h2 className="font-semibold text-2xl">Lihat Lebih Detail</h2>
					<p className="text-muted-foreground">Buka untuk melihat setiap jawabanmu</p>
				</div>

				<div className="overflow-hidden rounded-lg border bg-white shadow-sm">
					<Table>
						<TableHeader className="bg-blue-50/50">
							<TableRow className="hover:bg-blue-50/50">
								<TableHead className="w-20 font-bold text-blue-900">No</TableHead>
								<TableHead className="font-bold text-blue-900">Nama Subtes</TableHead>
								<TableHead className="font-bold text-blue-900">Score</TableHead>
								<TableHead className="font-bold text-blue-900">Durasi</TableHead>
								<TableHead className="w-25 text-right" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.tryout.subtests.map((subtest, index) => {
								const score = subtestScores.get(subtest.id);

								return (
									<TableRow key={subtest.id} className="hover:bg-blue-50/30">
										<TableCell className="font-medium">{index + 1}</TableCell>
										<TableCell className="font-medium">{subtest.name}</TableCell>
										<TableCell className="font-semibold">{score ?? 0}</TableCell>
										<TableCell>{subtest.duration} Menit</TableCell>
										<TableCell className="text-right">
											<Button
												size="icon"
												className="h-8 w-8 rounded-md bg-[#009CA6] hover:cursor-pointer hover:bg-[#008a93]"
												onClick={() => {
													if (session.data?.user.isPremium) {
														navigate({
															to: "/tryout/review/$attemptId/$subtestId",
															params: {
																attemptId,
																subtestId: subtest.id.toString(),
															},
														});
													} else {
														setShowPremiumDialog(true);
													}
												}}
											>
												<ArrowRightIcon className="size-4 text-white" weight="bold" />
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</div>

			<Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ups, belum premium!</DialogTitle>
						<DialogDescription>
							Maaf, fitur review hanya tersedia untuk pengguna premium. Silakan upgrade akun kamu untuk melihat
							pembahasan lengkap!
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowPremiumDialog(false)}>
							Tutup
						</Button>
						<Button className="bg-[#009CA6] hover:bg-[#008a93]" asChild>
							<Link to="/premium">Upgrade Sekarang</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
