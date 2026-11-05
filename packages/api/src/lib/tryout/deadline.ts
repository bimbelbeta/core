/**
 * Computes when a subtest must end, honouring both limits at once.
 *
 * A subtest has its own duration but can never run past the overall tryout deadline, so the
 * result is the earlier of the two. `startFrom` is the previous subtest's deadline, which chains
 * subtests back to back without idle time; it defaults to now for the first subtest.
 */
export function computeSubtestDeadline(durationMinutes: number, overallDeadline: Date, startFrom: Date = new Date()) {
	return new Date(Math.min(startFrom.getTime() + durationMinutes * 60 * 1000, overallDeadline.getTime()));
}
