import { domMax, LazyMotion } from "motion/react";

export function MotionProvider(props: { children: React.ReactNode }) {
	return <LazyMotion features={domMax}>{props.children}</LazyMotion>;
}
