import { authedImplementer } from "@/lib/router-definition";
import { subjectService } from "./service";

const authed = authedImplementer;

const list = authed.subject.list.handler(async ({ input, context }) =>
	subjectService.list(input, context.session.user),
);

const listContent = authed.subject.listContent.handler(async ({ input, context }) =>
	subjectService.listContent(input, context.session.user),
);

const findContent = authed.subject.findContent.handler(async ({ input, context }) =>
	subjectService.findContent(input, context.session.user),
);

const trackView = authed.subject.trackView.handler(async ({ input, context }) =>
	subjectService.trackView(input, context.session.user),
);

const trackSubjectView = authed.subject.trackSubjectView.handler(async ({ input, context }) =>
	subjectService.trackSubjectView(input, context.session.user),
);

const listRecentViews = authed.subject.listRecentViews.handler(async ({ context }) =>
	subjectService.listRecentViews(context.session.user),
);

const updateProgress = authed.subject.updateProgress.handler(async ({ input, context }) =>
	subjectService.updateProgress(input, context.session.user),
);

const stats = authed.subject.stats.handler(async ({ context }) => subjectService.stats(context.session.user));

export const subjectRouter = {
	list,
	listContent,
	findContent,
	trackView,
	trackSubjectView,
	listRecentViews,
	updateProgress,
	stats,
};
