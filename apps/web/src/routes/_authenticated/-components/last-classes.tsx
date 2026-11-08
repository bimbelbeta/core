import { ArrowRightIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LastContentViewedCard } from "@/components/classes/last-content-viewed-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";

export const LastClasses = () => {
	const { data, isPending } = useQuery(orpc.subject.listRecentViews.queryOptions());

	if (isPending) {
		return (
			<section>
				<Typography variant="subtitle2" className="mb-2">
					Kelas terakhirmu
				</Typography>
				<div className="animate-pulse space-y-2">
					<div className="h-32 rounded-md bg-neutral-200" />
					<div className="h-32 rounded-md bg-neutral-200" />
				</div>
			</section>
		);
	}

	if (!data || data.length === 0) {
		return (
			<section>
				<Typography variant="subtitle2">Kelas terakhirmu</Typography>
				<EmptyState
					title="Kamu belum melihat kelas apapun"
					desc={null}
					action={
						<Button asChild>
							<Link to="/classes">
								Belajar Sekarang <ArrowRightIcon />
							</Link>
						</Button>
					}
				/>
			</section>
		);
	}

	return (
		<section>
			<Typography variant="subtitle2" className="mb-4">
				Kelas Terakhir
			</Typography>
			<div className="space-y-6">
				{data.map((view, idx) => (
					<LastContentViewedCard
						key={view.contentId}
						subjectId={view.subjectId}
						item={{
							id: view.contentId,
							title: view.contentTitle,
							hasVideo: Boolean(view.hasVideo),
							hasNote: Boolean(view.hasNote),
							hasPracticeQuestions: Boolean(view.hasPracticeQuestions),
						}}
						index={idx}
						shortName={view.subjectShortName}
					/>
				))}
			</div>
		</section>
	);
};
