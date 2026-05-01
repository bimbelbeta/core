import { Card } from "@/components/ui/card";
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
						<h3 className="text-pretty font-semibold text-2xl leading-tight xl:text-2xl">{subject?.name}</h3>
						{/*<p className="font-light text-sm"> {subject?.totalContent} Konten</p>*/}

						{subject.category === "utbk" ? (
							<p className="font-light text-sm">SMA Kelas 12</p>
						) : (
							<p className="font-medium text-sm">
								<span className="uppercase">{subject.category}</span> Kelas {subject.gradeLevel ?? "-"}
							</p>
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
