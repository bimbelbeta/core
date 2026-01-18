export function PracticeQuestionHeader({ content }: { content: string }) {
	return (
		<div className="relative overflow-hidden bg-tertiary-200">
			{/* Ellipse background (dekoratif): center vertically, stick to the right, with some overflow */}
			<div
				className="absolute top-1/2 right-[-50px] size-[181px] -translate-y-1/2 rounded-full bg-tertiary-400"
				style={{ zIndex: 0 }}
			/>

			{/* Main content (penentu height) */}
			<div className="relative flex items-center gap-6 px-6 py-4" style={{ zIndex: 1 }}>
				<h1 className="font-medium text-neutral-1000 text-xl">{content}</h1>
			</div>
		</div>
	);
}
