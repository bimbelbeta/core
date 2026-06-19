import { useMemo } from "react";
import { useUnmount } from "@/hooks/use-unmount";

interface ThrottleSettings {
	leading?: boolean | undefined;
	trailing?: boolean | undefined;
}

const defaultOptions: ThrottleSettings = {
	leading: false,
	trailing: true,
};

// biome-ignore lint/suspicious/noExplicitAny: any is used to allow any function to be throttled
function createThrottle<T extends (...args: any[]) => any>(
	fn: T,
	wait: number,
	options: ThrottleSettings,
): {
	(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>;
	cancel: () => void;
	flush: () => void;
} {
	const { leading = false, trailing = true } = options;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastArgs: Parameters<T> | null = null;
	let lastThis: ThisParameterType<T> | null = null;
	let lastCallTime: number | null = null;
	let lastResult: ReturnType<T>;

	function invokeFunc(args: Parameters<T>, ctx: ThisParameterType<T>): ReturnType<T> {
		lastArgs = null;
		lastThis = null;
		lastCallTime = Date.now();
		lastResult = fn.apply(ctx, args);
		return lastResult;
	}

	function trailingEdge() {
		timeoutId = null;
		if (trailing && lastArgs && lastThis !== null) {
			return invokeFunc(lastArgs, lastThis);
		}
		lastArgs = null;
		lastThis = null;
		return lastResult;
	}

	function throttled(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
		const now = Date.now();
		const remaining = lastCallTime === null ? (leading ? 0 : wait) : wait - (now - lastCallTime);

		lastArgs = args;
		lastThis = this;

		if (remaining <= 0) {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			return invokeFunc(args, this);
		}

		if (!timeoutId && trailing) {
			timeoutId = setTimeout(trailingEdge, remaining);
		}

		return lastResult;
	}

	throttled.cancel = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		lastArgs = null;
		lastThis = null;
		lastCallTime = null;
	};

	throttled.flush = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		if (lastArgs && lastThis !== null) {
			return invokeFunc(lastArgs, lastThis);
		}
		return lastResult;
	};

	return throttled;
}

/**
 * A hook that returns a throttled callback function.
 *
 * @param fn The function to throttle
 * @param wait The time in ms to wait before calling the function
 * @param dependencies The dependencies to watch for changes
 * @param options The throttle options
 */

// biome-ignore lint/suspicious/noExplicitAny: any is used to allow any function to be throttled
export function useThrottledCallback<T extends (...args: any[]) => any>(
	fn: T,
	wait = 250,
	dependencies: React.DependencyList = [],
	options: ThrottleSettings = defaultOptions,
): {
	(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>;
	cancel: () => void;
	flush: () => void;
} {
	const handler = useMemo(
		() => createThrottle<T>(fn, wait, options),
		// biome-ignore lint/correctness/useExhaustiveDependencies: dependencies array intentionally managed by caller for custom control
		dependencies,
	);

	useUnmount(() => {
		handler.cancel();
	});

	return handler;
}

export default useThrottledCallback;
