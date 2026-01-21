import { useIsBreakpoint } from "./use-is-breakpoint";

export function useIsMobile() {
	return useIsBreakpoint("max", 768);
}
