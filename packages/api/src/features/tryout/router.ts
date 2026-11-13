import { authedImplementer } from "@/lib/router-definition";
import { activeSubtestService } from "./active-subtest.service";
import { tryoutReadService } from "./read.service";
import { startSubtestService } from "./start-subtest.service";
import { startTryoutService } from "./start-tryout.service";
import { submitService } from "./submit.service";

const authed = authedImplementer;

const list = authed.tryout.list.handler(async ({ input, context }) =>
	tryoutReadService.list(input, context.session.user),
);

const active = authed.tryout.active.handler(async ({ context }) => tryoutReadService.active(context.session.user));

const start = authed.tryout.start.handler(async ({ input, context }) =>
	startTryoutService.start(input, context.session.user),
);

const featured = authed.tryout.featured.handler(async ({ context }) =>
	tryoutReadService.featured(context.session.user),
);

const find = authed.tryout.find.handler(async ({ input, context }) =>
	tryoutReadService.find(input, context.session.user),
);

const startSubtest = authed.tryout.startSubtest.handler(async ({ input, context }) =>
	startSubtestService.start(input.tryoutId, input.subtestId, context.session.user.id),
);

const saveAnswer = authed.tryout.saveAnswer.handler(async ({ input, context }) =>
	activeSubtestService.saveAnswer(input, context.session.user.id),
);

const toggleRaguRagu = authed.tryout.toggleRaguRagu.handler(async ({ input, context }) =>
	activeSubtestService.toggleRaguRagu(input, context.session.user.id),
);

const submitSubtest = authed.tryout.submitSubtest.handler(async ({ input, context }) =>
	submitService.submitSubtest(input, context.session.user.id),
);

const submitTryout = authed.tryout.submitTryout.handler(async ({ input, context }) =>
	submitService.submitTryout(input, context.session.user.id),
);

const history = authed.tryout.history.handler(async ({ context }) => tryoutReadService.history(context.session.user));

const result = authed.tryout.result.handler(async ({ input, context }) =>
	tryoutReadService.result(input, context.session.user),
);

const ranking = authed.tryout.ranking.handler(async ({ input, context }) =>
	tryoutReadService.ranking(input, context.session.user),
);

const review = authed.tryout.review.handler(async ({ input, context }) =>
	tryoutReadService.review(input, context.session.user),
);

export const tryoutRouter = {
	list,
	active,
	find,
	start,
	featured,
	startSubtest,
	saveAnswer,
	toggleRaguRagu,
	submitSubtest,
	submitTryout,
	history,
	result,
	ranking,
	review,
};
