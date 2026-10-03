# Open Connector Skill Marketplace

Installable Agent Skills for [Open Connector](https://openconnector.dev). The official `oc-cli` guide teaches agents the CLI workflow; community task Skills use one or more Open Connector Tools. Each Skill is a `SKILL.md` that the agent reads and follows. Open Connector handles connections and Tool execution.

Browse published Skills at [openconnector.dev/skills](https://openconnector.dev/skills). Install a specific Skill with the [Skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add openconnector-dev/skill-marketplace --skill github-issue-to-slack -g -a codex
npx skills add openconnector-dev/skill-marketplace --skill github-issue-to-slack -g -a claude-code
```

The site and its public API read `catalog.json` from this repository's merged `main` branch. A reviewed PR is the publication gate. After a merge, the new catalog becomes visible as the site's cache refreshes. Already installed copies change only when their owner runs `npx skills update -g <slug>`.

The official `oc-cli` guide uses the same installer:

```sh
npx skills add openconnector-dev/skill-marketplace --skill oc-cli -g -a codex
npx skills add openconnector-dev/skill-marketplace --skill oc-cli -g -a claude-code
npx skills update -g oc-cli
```

The guide lives in [`skills/oc-cli`](skills/oc-cli/SKILL.md) and is discoverable by the Skills CLI. The website catalog lists task Skills with `marketplace.json` metadata. If an older `oc skills install` created an `oc-cli` copy, inspect its path in `~/.config/oc/installations.json` and archive or remove that copy before installing through the Skills CLI.

The [Open Connector Agent Plugin](https://github.com/openconnector-dev/openconnector-agents-plugin) is a separate package with its core `openconnector` Skill. Installing that plugin does not install this task Skill catalog.

## Contribute

Add `skills/<slug>/SKILL.md` and `marketplace.json`, then run `npm run catalog` and commit the resulting `catalog.json`. See [CONTRIBUTING.md](CONTRIBUTING.md). Anyone may open a PR or improve an existing Skill; maintainers review changes before merging.

All Skills and catalog files are MIT licensed. The official `oc-cli` guide includes a copy of the [MIT license](skills/oc-cli/LICENSE.md) so it remains with the guide when installed. Skills contain instructions and static files only, never credentials or executable scripts.
