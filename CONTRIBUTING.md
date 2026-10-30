# Contributing a Skill

1. Fork this repository and create `skills/<slug>/SKILL.md`. Use a globally unique lowercase slug with hyphens. The YAML frontmatter must have one-line `name` (equal to the slug) and `description` fields.
2. Add `marketplace.json` with a display title, author, Toolkit slugs, and exact Open Connector Tool slugs. Use at least one Tool. Put longer instructions in `references/*.md` if needed. Only Markdown, JSON, and static images are accepted; do not add scripts or secrets.
3. Explain when the agent should use the Skill, how it obtains current Tool schemas, how outputs feed later steps, and what to do on failure. Mark write or destructive steps clearly and tell the agent to confirm them with the user individually before calling a Tool.
4. Run `npm run catalog`, commit `catalog.json`, and open a PR with a short example task and the Tool calls you checked. CI runs `npm run check`.

Every PR also gets an automatic security review from Claude, posted as a PR comment. It runs automatically for owners, members, collaborators, and authors who already have a merged PR; first-time contributors are reviewed after a maintainer adds the `security-review` label. A PR from an automatically reviewed author is merged when Claude finds no medium or high risk issues, `npm run check` passes, and only files under `skills/` and `catalog.json` changed. Anything else waits for a maintainer.

Maintainers review every PR, including corrections to another author's Skill. The original author stays credited; significant later contributors may be added to `marketplace.json`. Merging publishes the current content at the same slug. To correct a bad publication, revert the PR.
