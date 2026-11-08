export function computeSubtestDeadline(durationMinutes: number, overallDeadline: Date, startFrom: Date = new Date()) {
	return new Date(Math.min(startFrom.getTime() + durationMinutes * 60 * 1000, overallDeadline.getTime()));
}
