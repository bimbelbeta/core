# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `bimbelbeta/core`. Use the `gh` CLI.

## Conventions

- Create: `gh issue create --title "..." --body "..."`. Use a heredoc for multiline bodies.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,body,labels,comments`, with appropriate `--label` and `--state` filters.
- Sub-issues: `gh issue create --parent <parent> ...` or `gh issue edit <parent> --add-sub-issue <child>`. If unavailable, put `Part of #<parent>` at the top of the child body.
- Blocking: use native issue dependencies: `gh issue create --blocked-by <n>,<n> ...` or `gh issue edit <child> --add-blocked-by <blocker>`. If unavailable, put `Blocked by: #<n>, #<n>` at the top of the child body. A ticket is unblocked when every blocker is closed.
- Count open blockers: `gh api repos/{owner}/{repo}/issues/<n> --jq .issue_dependencies_summary.blocked_by`.
- Comment: `gh issue comment <number> --body "..."`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close: comment with the explanation, then `gh issue close <number>`.

Before the first issue creation in a session, check the target with `gh repo view --json nameWithOwner`; confirm with the user if it is not `bimbelbeta/core`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Publishing and fetching

- When a skill says "publish to the issue tracker", create a GitHub issue.
- When a skill says "fetch the relevant ticket", read it using the command above.

## Wayfinding operations

A map is an issue labelled `wayfinder:map`. Child tickets are linked as sub-issues and labelled `wayfinder:<type>` (`research`, `prototype`, `grilling`, or `task`). If sub-issues are unavailable, add children to a task list in the map and put `Part of #<map>` in each child.

To find the frontier, list open children in map order and select the first with no open blocker or assignee. Claim it with `gh issue edit <n> --add-assignee @me`. To resolve it, comment with the answer, close it, and append a context pointer with a gist and link to the map's Decisions-so-far.
