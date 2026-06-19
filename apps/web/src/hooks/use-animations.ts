import { useInView as useFramerInView } from "motion/react";
import { useRef } from "react";

export function useInView(options = {}) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useFramerInView(ref, {
		once: true,
		amount: 0.1,
		...options,
	});

	return [ref, isInView] as const;
}
