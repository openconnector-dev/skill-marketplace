---
name: oc-cli
description: Operate Open Connector with the first-party oc CLI. Use when an agent needs to discover tools or Trigger Types, connect an account, execute a tool, manage Trigger Instances, or proxy a provider API through Open Connector.
---

# Open Connector CLI

Use `oc` through its retained Human OAuth login and selected Organization, Project, and connector userId. It talks to the native `/api/v1` API. Human-readable output is the default; agents use the explicit `oc --json --no-input ...` form whenever they parse command output. `--json` and `--plain` are mutually exclusive, and `--json` disables prompts, TUI, and browser opening automatically. Use `--plain --no-input` when a Human-readable one-shot result is needed without terminal interaction. Primary JSON/JSONL results belong on stdout; progress, authorization URLs, warnings, and structured errors belong on stderr. Preserve opaque cursors exactly, and pass credentials through stdin or a protected file rather than argv.

## Default workflow

1. Start with `oc --json --no-input doctor`. Stop and fix its `next` instruction when `ok` is false.
2. When exact tool slugs are known, inspect 1–20 of them with one `oc --json --no-input tools info <slug...>` call. Never serially invoke `tools info` for candidates that fit in one batch. Every response uses `{ tools, errors, summary }`; each `tools[slug]` is the complete Tool detail. Otherwise use `oc --json --no-input search <task>`; search is deterministic, not semantic. Human TTYs may use `oc toolkits list` or `oc tools list [toolkit]` as retained browsers: `/` searches, arrows or `j`/`k` move, `n`/`p` page, Enter opens lazy details, and `q` exits. Enter from a Tool detail continues into schema-driven input, explicit account selection, redacted review, and confirmation. Agents keep using exact selectors plus `--json --no-input` and opaque cursors.
3. For a write tool, prepare input in a file and run `oc --json --no-input execute <slug> --dry-run --connected-account <id> --data @input.json`. Dry-run performs bounded local schema checks and redacts sensitive fields; it never calls the execution endpoint.
4. Execute with `oc --json --no-input execute <slug> --data @input.json` only when the user authorized the action.
5. If execution reports a missing connection, inspect Auth Configs and run `oc --json --no-input link <toolkit> --auth-config <id> --no-wait`. Agents never use the interactive Toolkit/Auth Method picker. If the link remains pending, inspect it or use `oc --json --no-input connected-accounts wait <id> --timeout 5m`; do not create a duplicate link.
6. For machine credentials, first inspect with `oc --json --no-input orgs keys list` or `oc --json --no-input projects keys list`. Use `info <key-id>` for one safe row. Preview mutations with `--dry-run`; create/rotate with an explicit `--yes` and revoke with `--yes` (legacy `--force` is accepted for rotate/revoke). Choose exactly one grant form: `--preset <preset>` or `--permissions <resource:action,...>`. Plaintext from create/rotate is returned exactly once and must be moved to protected storage immediately; it never appears in list/info/errors.
7. When the host needs the full Open Connector Agent Plugin, first run `oc --json setup <agent> --dry-run`, then run `oc --json setup <agent> --no-input --yes` only after the user approves because it changes that agent's plugin configuration. Do not invoke interactive `oc setup` from an agent or script.
8. When the user wants a personal MCP connection, preview `oc --json mcp setup <client> --dry-run`, inspect the safe target/diff, then apply with `--yes` only after approval. This is separate from Agent Plugin setup. Human setup without a client is limited to detected automatic hosts and prints official manual guides when none are detected.
9. For realtime events, inspect `oc --json triggers list <toolkit>` and `oc --json triggers info <slug>` before creating an instance with an exact Connected Account and reviewed Trigger config.

## Setup

`oc login` uses OAuth Device Authorization. A Human completes this setup and selects an ordinary Organization, Project, and Project-local connector userId:

```sh
oc login --url https://api.openconnector.dev
oc orgs switch <organization>       # exact selector for Agent/script calls
oc projects switch <project>
oc projects user-id user_123
```

In a Human TTY, `oc orgs switch` without a selector opens a bounded Organization
selector and confirms before changing the local CLI context. `oc orgs create`
can also prompt for a missing name, show the derived slug for review, and be
cancelled before any server mutation. Plain, JSON, redirected, and Agent calls
must provide the selector/name explicitly; ambiguous names return structured
candidates and a recovery command.

Project context follows the same rule. `oc projects list` and `oc projects current`
show the live Project identity, current marker, environment, and saved Project-local
Connector `userId`. In a Human TTY, `oc projects switch` without a selector opens a
bounded selector and confirms before changing the local context; Agents and JSON or
no-input calls must pass an exact id or unique name. `oc projects create` prompts for
only a missing name, reviews the resolved Organization and environment, and can be
cancelled before mutation. `oc projects user-id` pre-fills the saved value when
interactive and explains that Connector `userId` is a caller-chosen business partition,
not the signed-in Human or provider identity. Switching Project restores its saved
default without changing another Project's value.

`oc logout` explains that it revokes the current Human grant when supported and
removes local OAuth credentials plus CLI context. Human TTYs confirm the action;
non-interactive calls must use `oc logout --yes`. Cancellation leaves both local
state and the remote grant untouched.

## Discover, connect, execute

```sh
oc --json --no-input search "create a github issue" --toolkit github
oc --json --no-input tools info GITHUB_ISSUES_CREATE SLACK_CHAT_POST_MESSAGE
oc --json --no-input toolkits info github
oc --json --no-input auth-configs create github --auth-method github.oauth2
oc --json --no-input --user-id user_123 link github --auth-config ac_... --no-wait
oc --json --no-input connected-accounts list --toolkit github --status active --limit 50
oc --json --no-input connected-accounts wait conn_... --timeout 5m
oc --json --no-input execute GITHUB_ISSUES_CREATE --connected-account conn_... \
  --dry-run --data @issue.json
oc --json --no-input execute GITHUB_ISSUES_CREATE --connected-account conn_... --data @issue.json
oc --json --no-input triggers list github
oc --json --no-input triggers info GITHUB_COMMIT_EVENT
oc --json --no-input triggers create GITHUB_COMMIT_EVENT --connected-account conn_... \
  --trigger-config @trigger.json
oc --json --no-input triggers status --connected-account-ids conn_...
oc --json --no-input trigger-events list --toolkits github --limit 20
oc --json --no-input trigger-events replay tev_... --forward http://127.0.0.1:3000/webhooks/openconnector --dry-run
oc --json --no-input trigger-events replay tev_... --forward http://127.0.0.1:3000/webhooks/openconnector --yes
oc --json --no-input triggers listen --toolkits github --connected-account-id conn_... \
  --forward http://127.0.0.1:3000/webhooks/openconnector
```

`--data`, `--credentials`, and `--connection-config` accept inline JSON, `@file.json`, or `-` for stdin. Keep `--json` explicit in every agent or script command; do not rely on terminal detection or an implicit output mode.

## Safety

- Do not execute write tools, link accounts, create auth configs, proxy write methods, or delete connections unless the user requested that action.
- Prefer one `tools info` batch (up to 20 slugs), then `execute --dry-run`, before a write. Batch info reports per-tool errors without discarding successful details; dry-run parses the request but does not claim server-side schema validation.
- Never put API keys, client secrets, or credential JSON directly in command arguments. Use stdin (`-`) or a protected file.
- Organization and Project machine-key plaintext is an issuance-only value. Never paste it into a later
  CLI argument, list/info request, prompt review, shell guidance, log, or Agent message; use a protected
  secret store instead.
- Preview deletion with `oc connected-accounts delete <id> --dry-run`; only use `--force` after explicit user authorization.
- Treat Trigger create, disable, and delete as provider-affecting writes. `triggers disable` requires `--force`; preview `triggers delete` with `--dry-run` before the exact `--force` call.
- Pass `--json` to keep stdout and errors machine-readable. Read recovery commands from structured errors and retry the narrow original command.

## Resource commands

- `oc toolkits list|info`: discover Toolkits, inspect metadata, and find auth methods. Use `list --query` to filter.
- `oc tools list|info|execute`: filter tools with `list --query`; `info` inspects one Tool or batches up to 20 complete details in one request; then execute tools.
- `oc auth-configs create|list|info`: manage auth configurations.
- `oc orgs keys list|info|create|rotate|revoke` and `oc projects keys list|info|create|rotate|revoke`:
  manage Organization/Project machine credentials. Lists and info are secret-free; use `--dry-run`
  before a mutation and `--yes` for non-interactive create/rotate/revoke.
- `oc connected-accounts link|wait|list|info|delete`: create, resume, and manage connections. List is Project-wide unless an agent passes explicit `--user-id`, `--toolkit`, `--auth-config`, `--status`, `--connection`, or `--alias` filters; preserve returned opaque cursors. Interactive Humans may omit the Toolkit and search remotely; agents pass exact selectors with `--json` and `--no-input`. Never choose among an ambiguous alias candidate list; retry with an exact Connected Account ID.
- `oc triggers list|info|status|create|enable|disable|delete`: discover Trigger Types and manage realtime Trigger Instances. Create accepts JSON, `@file`, or stdin for config/setup inputs.
- `oc triggers listen`: receive Project Trigger Events over an authenticated realtime stream. Agents must use `oc --json triggers listen` for exactly one stable Trigger Event View per JSONL line; scope it with exact Toolkit, Trigger Instance, Connected Account, Trigger slug, or connector user flags, and use `--out` for a protected JSONL copy. Human TTYs get a retained view with pause, validated filter editing, detail, clear, reconnect state, and terminal-safe exit; `--plain`/`--table` never initialize OpenTUI. Reconnect is at-least-once, so de-duplicate business work by Trigger Event id. `--forward` posts the production-compatible signed envelope to a local handler; local failure does not block cursor progress or mutate server delivery, and a missed event can be replayed separately.
- `oc trigger-events list`: query one bounded retained Trigger Event history page with the same filters and an opaque cursor. Human rows omit payloads; Agent JSON retains the complete safe event projection and requires `trigger-event:read`.
- `oc trigger-events replay <eventId>`: inspect one exact retained event. For local replay, first run `oc --json trigger-events replay <eventId> --forward <url> --dry-run`, then use the same exact id and URL with `--yes`. The signed envelope preserves the original event id/payload but uses a fresh forwarding timestamp/signature. Local failure exits non-zero and does not change server publication or durable Webhook delivery; use the API/Console redelivery operation for durable production retries.
- `oc proxy <url> --connection <id>`: make a direct provider API request through a Connected Account. Agents use `--json` with an exact ID/alias; preview with `--dry-run`. Request values are redacted from reviews, and an ambiguous alias must be retried with an exact ID.
- `oc mcp url|setup|authorizations`: print or install the fixed Human OAuth `/mcp` endpoint, then list or revoke per-client Project grants. Setup supports `codex`, `claude`, `cursor`, and `vscode`.
- Install this guide with `npx skills add openconnector-dev/skill-marketplace --skill oc-cli -g -a codex` (or `-a claude-code`). Update a global copy explicitly with `npx skills update -g oc-cli`.
- `oc setup` / `oc setup <agent...>`: humans get detected-host selection and a complete preview before confirmation; agents use explicit targets and `--dry-run` followed by `--yes`. Claude uses its marketplace adapter; compatible clients use the Agent Plugins v1 package through their host-specific install surface.
- `oc upgrade`: preview binary replacement and Agent Plugin refreshes with `--dry-run`; after approval, use `--yes` to replace the CLI binary and refresh recorded Agent Plugins. Skills are updated separately through the Skills CLI.

MCP setup writes only the fixed server name `openconnector` and URL; it must never copy the CLI token, a Project key, context headers, or Connector `userId` into a client configuration. In non-interactive use, pass the client explicitly, inspect `--dry-run`, and use `--yes` only with authorization. Revoke an MCP context only when the user names or confirms the exact client/Organization/Project context; sibling grants and CLI login must remain unaffected.

## Boundaries

The native CLI does not provide a JavaScript sandbox or Composio cloud login. `oc search` uses deterministic native catalog ranking, not semantic search. Do not suggest `oc run` or semantic-search behavior. Use `oc <command> --help` to inspect current options.
