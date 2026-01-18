import { CookingPotIcon } from "@phosphor-icons/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyContentState({
  title,
  desc,
}: {
  title?: string;
  desc?: string;
}) {
  const defaultTitle = "Ups, kontennya belum tersedia";
  const defaultDesc = "Tunggu kontennya diracik dulu ya!";

	return (
		<Empty className="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CookingPotIcon />
        </EmptyMedia>
        <EmptyTitle>{title || defaultTitle}</EmptyTitle>
        <EmptyDescription>{desc || defaultDesc}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
	);
}
