---
name: github-issue-to-slack
description: Share the current details of a specific GitHub issue in a Slack channel using Open Connector.
---

# Share a GitHub issue in Slack

Use this Skill when the user gives a GitHub issue and asks you to post a concise update in a Slack channel. This task reads GitHub with `GITHUB_ISSUES_GET` and writes to Slack with `SLACK_CHAT_POST_MESSAGE`.

1. Identify the exact GitHub owner, repository, and issue number, plus the exact Slack channel. Ask for missing identifiers. Do not guess a channel.
2. Check that Open Connector is ready with `oc --json --no-input doctor`. Inspect both current Tool schemas in one call: `oc --json --no-input tools info GITHUB_ISSUES_GET SLACK_CHAT_POST_MESSAGE`. Use the returned input fields rather than assuming this Skill contains a current schema.
3. Find the active Connected Account for each Toolkit. Use exact account IDs when executing; do not choose an ambiguous account.
4. Call `GITHUB_ISSUES_GET` with the user's issue identity. Extract the title, URL, current state, and relevant body or latest context from the response. If the issue cannot be found, stop without posting.
5. Draft a short Slack message that links to the issue and distinguishes facts from your summary. Show the exact destination and message to the user and get confirmation before posting.
6. Use `oc --json --no-input execute SLACK_CHAT_POST_MESSAGE --connected-account <slack-account-id> --dry-run --data @message.json` to check the prepared input. Then execute the same Tool with the confirmed destination and message. Report the Tool result and do not claim success if the provider reports failure.

Never copy private issue content to a Slack channel unless the user specifically authorized that destination.
