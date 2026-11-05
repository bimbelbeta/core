import { Typography } from "@/components/ui/typography";

export function PracticeQuestionHeader({ content }: { content: string }) {
	return (
		<div className="bg-tertiary-200 relative overflow-hidden">
			{/* Ellipse background (dekoratif): center vertically, stick to the right, with some overflow */}
			<div
				className="bg-tertiary-400 absolute top-1/2 right-[-50px] size-[181px] -translate-y-1/2 rounded-full"
				style={{ zIndex: 0 }}
			/>

			{/* Main content (penentu height) */}
			<div className="relative flex items-center gap-6 px-6 py-4" style={{ zIndex: 1 }}>
				<Typography variant="title" className="text-neutral-1000">
					{content}
				</Typography>
			</div>
		</div>
	);
}
