import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { cn } from "@/lib/utils";
import { BackButton } from "../shared/back-button";
import { Badge } from "../ui/badge";

type SubjectHeaderProps = {
	id: number;
	name: string;
	category: "sd" | "sma" | "smp" | "utbk";
	gradeLevel: number | null;
	hasViewed?: boolean;
};

export function ClassHeader({ subject }: { subject: SubjectHeaderProps }) {
	const isAdmin = useIsAdmin();
	const backPath = isAdmin ? "/admin/classes/" : "/classes/";

	return (
		<Card className={cn("relative h-auto overflow-hidden border border-neutral-200 bg-white p-4 shadow-md")}>
			<div className="flex h-full justify-between pb-5">
				<div className="my-auto space-y-4">
					<BackButton to={backPath} />
					<div>
						<Typography variant="title" as="h3" className="text-pretty">
							{subject?.name}
						</Typography>

						{subject.category === "utbk" ? (
							<Typography variant="overline">SMA Kelas 12</Typography>
						) : (
							<Typography variant="overline">
								<span className="uppercase">{subject.category}</span> Kelas {subject.gradeLevel ?? "-"}
							</Typography>
						)}
					</div>
				</div>

				<div className="flex flex-col items-end justify-between gap-y-4.5">
					<div className="space-x-3">
						{subject?.category && <Badge className="font-normal uppercase">{subject?.category}</Badge>}
						{subject.hasViewed && <Badge className="font-normal">Sudah Pernah Dibuka</Badge>}
					</div>
				</div>
			</div>
		</Card>
	);
}
