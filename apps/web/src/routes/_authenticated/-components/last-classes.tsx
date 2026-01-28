import { ArrowRightIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LastContentViewedCard } from "@/components/classes/last-content-viewed-card";
// import { LastContentViewedCard } from "@/components/classes";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

export const LastClasses = () => {
	const { data, isPending } = useQuery(orpc.subject.getRecentViews.queryOptions());

	if (isPending) {
		return (
			<section>
				<h2 className="mb-2 font-medium">Kelas terakhirmu</h2>
				<div className="animate-pulse space-y-2">
					<div className="h-32 rounded-md bg-neutral-200" />
					<div className="h-32 rounded-md bg-neutral-200" />
				</div>
			</section>
		);
	}

	if (!data || data.length === 0) {
		return (
			<section className="">
				<h2 className="font-medium">Kelas terakhirmu</h2>
				<div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
					<WarningCircleIcon size={80} />
					<p className="text-black text-xl">Kamu belum melihat kelas apapun</p>
					<Button asChild>
						<Link to="/classes">
							Belajar Sekarang <ArrowRightIcon className="" />
						</Link>
					</Button>
				</div>
			</section>
		);
	}

	return (
		<section>
			<h2 className="mb-4 font-medium text-xl">Kelas Terakhir</h2>
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
						shortName={view.subtestShortName}
					/>
				))}
			</div>
		</section>
	);
};
