import { SmileyXEyesIcon } from "@phosphor-icons/react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function NotFoundContentState({ title, desc }: { title?: string; desc?: string }) {
	const defaultTitle = "Ups, kontennya belum tersedia";
	const defaultDesc = "Tunggu kontennya diracik dulu ya!";

	return (
		<Empty className="">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<SmileyXEyesIcon />
				</EmptyMedia>
				<EmptyTitle>{title || defaultTitle}</EmptyTitle>
				<EmptyDescription>{desc || defaultDesc}</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
