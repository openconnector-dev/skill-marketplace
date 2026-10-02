# Open Connector Skill Marketplace

Community Agent Skills for tasks that use [Open Connector](https://openconnector.dev) Tools. Each Skill is a `SKILL.md` that an agent can install, read, and use to call one or more Toolkits. The agent runs each step; Open Connector handles connections and Tool execution.

Browse published Skills at [openconnector.dev/skills](https://openconnector.dev/skills). Install a specific Skill with the [Skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add openconnector-dev/skill-marketplace --skill github-issue-to-slack -g -a codex
npx skills add openconnector-dev/skill-marketplace --skill github-issue-to-slack -g -a claude-code
```

The site and its public API read `catalog.json` from this repository's merged `main` branch. A reviewed PR is the publication gate. After a merge, the new catalog becomes visible as the site's cache refreshes. Already installed copies change only when their owner runs `npx skills update -g <slug>`.

The [Open Connector Agent Plugin](https://github.com/openconnector-dev/openconnector-agents-plugin) is a separate package with its core `openconnector` Skill. Installing that plugin does not install this task Skill catalog.

## Contribute

Add `skills/<slug>/SKILL.md` and `marketplace.json`, then run `npm run catalog` and commit the resulting `catalog.json`. See [CONTRIBUTING.md](CONTRIBUTING.md). Anyone may open a PR or improve an existing Skill; maintainers review changes before merging.

All repository content is MIT licensed. Skills contain instructions and static files only, never credentials or executable scripts.
