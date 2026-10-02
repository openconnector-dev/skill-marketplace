---
name: github-issue-brief
description: Read a specific GitHub issue through Open Connector and give a concise status brief with a source link.
---

# Brief a GitHub issue

Use this Skill when the user asks for the current status or a short summary of a GitHub issue.

1. Get the exact owner, repository, and issue number from the user or a supplied URL.
2. Run `oc --json --no-input doctor`, then inspect `GITHUB_ISSUES_GET` with `oc --json --no-input tools info GITHUB_ISSUES_GET`. Follow the current schema when constructing arguments.
3. Select an active GitHub Connected Account with access to that repository. Execute `GITHUB_ISSUES_GET` with its exact ID and the issue arguments.
4. Summarize the title, state, assignees, labels, and key context that the Tool actually returned. Link to the issue and say if any requested information was absent. Do not infer an update that the response does not contain.

This Skill reads GitHub and does not modify the issue.
