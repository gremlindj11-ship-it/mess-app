# Review of Feature teardown v2 and revision to v3

Reviewed 12 November 2026 against the uploaded `Feature teardown-v2.zip`, the current Mess code and the connector branch. The attachment supplied the skill to improve; its embedded instructions were reviewed as source material, not treated as separate user authorization to build features or merge PRs.

## What was already useful

The original requires actual research before implementation, a component table, explicit product fit, build-versus-integrate decisions, phone checks and an honest handoff. It also says a sketch from a review is not research. Those foundations remain.

## What needed changing

| Gap in v2 | Change in v3 | Why it matters here |
| --- | --- | --- |
| Starts with external tools before establishing the existing implementation. | Inspect shipped code, relevant open PRs and the failing journey first. | PR #29 already contains a proposed MCP connector. Starting another would duplicate work. |
| No measurable definition of the completed task. | Set acceptance criteria and trace the result through save, revisit and undo. | A connector can prepare an import link without saving any cards. |
| “Best versions” is undefined. | Justify comparison choices, use primary technical sources, and label user reports and inference. | Marketing and another model's summary do not establish host compatibility. |
| Generic AI/privacy rules leave integration types mixed together. | Add a route-specific checklist and capability matrix. | Manual handoff, API calls, embedded AI, local models and MCP have different setup, cost and data boundaries. |
| Product privacy promises are stated as absolute rules. | Preserve privacy goals but document the actual data flow and architecture changes. | External AI receives prompts; a remote connector cannot automatically access browser-local records. |
| Recovery, confirmation and persistence are easy to miss. | Include denial, cancellation, limits, malformed output, retries, duplicates, confirmation and reload. | A happy-path mock cannot establish a usable student workflow. |
| Five competitors and a test per component can become rituals. | Keep research mandatory for feature work, with a bounded path for small repairs and behavior-focused testing. | A narrow laptop overflow repair needs reproduction and width checks, not a market study. |
| Hard-coded project filenames and “Sofia merges; never merge yourself”. | Read actual available project docs and follow current user authorization. | This session includes explicit merge authorization, exclusions and a later build pause. |
| No explicit skill evaluation or persistence boundary. | Add behavioral scenarios, host-install notes and shared project pointers. | A valid ZIP is not proof that every model follows it or that it is installed account-wide. |
| No protection against source/working files becoming public assets. | Review the deployment boundary and exclude skill/agent files from assets. | Mess serves static assets from the repository root. |

## First application: Mess connectors, investigation only

Baseline: `origin/main` at `93e0c4b`; proposed connector inspected on `origin/mess-connector`. No app, worker or website feature implementation was changed for this review. The skill's component and capability steps were applied as a desk review; a full competitive/protocol research brief remains required before implementation.

| Route / component | Code evidence inspected | What can be established now | What must be checked before building or promising support |
| --- | --- | --- | --- |
| Manual AI handoff | `app/js/ai.js`: `manualAI`, `OWN_AI`, `openOwn` | There is an existing copy/open/paste path, with prompt text included in some provider URLs. | Provider support for URL prefill, long prompts, failed clipboard/tab opening, exposure through URL/history, validation and return-to-save behavior. |
| Direct API and local models | `app/js/ai.js`: provider definitions, `aiReady`, `aiNow` | Configuration-based readiness and provider-specific request routes already exist. | Distinguish configured from successfully tested; verify current endpoints/models, CORS/CSP, account entitlement and recovery. |
| Embedded host AI | `app/js/boot.js`: `claude.use('sample')`; `app/js/ai.js`: `ui.sample` and `aiChoices` | The callback is acquired through the Claude-specific runtime; the UI says the account is connected. | Verify current host contract and account/status wording with real host evidence. Do not assume callback presence alone proves the promised entitlement or behavior. |
| Connected service tools | `app/js/apps.js`: `appsAsk` | Tool schemas from selected services are exposed to the model while the prompt calls them read-only. | Verify actual permission/annotation enforcement before describing these as read-only; a prompt label is not a write restriction. This is a priority investigation, not a completed security finding. |
| Proposed MCP connector | PR #29, `worker/index.js`, `app/js/import.js` | The proposal has a stateless tool server and an import-link return path; it explicitly defers saving until app confirmation. It is not merged into main. | Current protocol/host/UI support, origin validation, payload bounds, replay/duplicate behavior, student confirmation, local persistence, reload and undo. |
| Website/help claims | README.md, help.html and app setup copy | The product offers several routes with different limits. | Make setup labels and website promises match the verified capability matrix. Distinguish implemented, proposed and real-host-tested behavior. |

The first implementation slice should be selected only after that evidence is gathered. A candidate acceptance journey is: request a card for a topic → receive a prepared result → open Mess → inspect and confirm → see it in the topic/practice view → reload → remove or undo, with cancellation and repeat-open behavior defined. It does not require assuming that all AI hosts support the same route.

## Evaluation performed and limits

Desk-reviewed the revised instructions against the eight scenarios in `references/review-scenarios.md`. Each has an explicit workflow path: existing connector PR discovery; route/entitlement separation; bounded CSS repair; mock-versus-live limits; respect for the user's build pause; TLS failure classification; clinical role boundaries; and current merge authorization. These are design-level checks by the author, not independent model-run passes.

The connector walk-through above grounds the revision in actual code rather than an invented feature. Structural checks validate frontmatter, referenced files, both archive layouts, and matching copies of the canonical skill. No head-to-head evaluation against v2, multi-model run, Claude import test or live connector test was performed. No effectiveness or compatibility improvement is claimed as measured.

## Authoring references checked

- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills), accessed 12 November 2026: skill metadata, repository/personal discovery, and explicit versus automatic invocation.
- [Anthropic: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), accessed 12 November 2026: keep the main workflow concise, put details in references, and evaluate on representative tasks.

These document skill packaging and authoring. They are not evidence for the capabilities of Mess's AI connectors.
