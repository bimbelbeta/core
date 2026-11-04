import { useEffect, useRef } from "react";

export interface TryoutSettingsFormState {
	isDirty: boolean;
	canSubmit: boolean;
	isSubmitting: boolean;
}

export function FormStateNotifier({
	state,
	onFormStateChange,
}: {
	state: { isDirty: boolean; canSubmit: boolean; isSubmitting: boolean };
	onFormStateChange?: (state: TryoutSettingsFormState) => void;
}) {
	const prevStateRef = useRef(state);

	useEffect(() => {
		const prev = prevStateRef.current;
		if (
			prev.isDirty !== state.isDirty ||
			prev.canSubmit !== state.canSubmit ||
			prev.isSubmitting !== state.isSubmitting
		) {
			prevStateRef.current = state;
			onFormStateChange?.(state);
		}
	}, [state, onFormStateChange]);

	return null;
}
