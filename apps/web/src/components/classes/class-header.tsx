import type { SubjectListItem } from "./classes-types";

export function ClassHeader({ subject }: { subject: SubjectListItem }) {
	return (
		<div className="relative flex items-center justify-start overflow-hidden rounded-default bg-tertiary-200 p-6 sm:p-8">
			<div className="relative z-10 flex size-28 items-center justify-center rounded-full bg-white shadow-md sm:size-32">
				<div className="flex size-full items-center justify-center">
					<span className="text-2xl sm:text-3xl text-black">{subject?.id}</span>
				</div>
			</div>
			<div className="ml-4 flex-1">
				<h2 className="font-bold text-[18px] text-neutral-1000 sm:text-[24px]">{subject?.name}</h2>
				<p className="mt-1 text-[12px] text-neutral-800 sm:text-[14px]">{subject?.description}</p>
			</div>
		</div>
	);
}
