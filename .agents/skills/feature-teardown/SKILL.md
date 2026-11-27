---
name: feature-teardown
description: "Use before designing, building, changing or reviewing a product feature, app, website, workflow, AI integration or connector. Inspect what exists, research working alternatives, break down the whole user journey, fit it to the product, and verify it end to end. Also use for feature requests from reviews and backlogs. For small bug fixes, use the bounded repair path. Pure factual answers and content-only fact checks do not require a product teardown."
---

# Feature teardown: understand, research, fit, build, verify

Build the useful working journey, including recovery, rather than stopping at a convincing interface. Apply this process to every feature regardless of who proposed it. A previous sketch or another model's review is a lead to verify, not completed research.

Follow the user's current scope and authorization. This skill does not grant permission to publish, merge, spend money, connect accounts, change clinical claims, or send messages. It does not require another approval for work already authorized. If the user says to pause before building, stop at the brief.

## 1. Establish the job and inspect what exists

- State the user, the task they need to complete, and the observable successful outcome. Identify the current problem and what must remain working.
- Read applicable agent instructions, the product brief if present, design rules and relevant code. In Mess, start with README.md, DESIGN.md and the affected app/website files. Never invent a missing PROJECT.md or treat an old handover as current code.
- Check the deployed version, main branch, open PRs and existing tests as relevant. Distinguish shipped, implemented but unmerged, proposed, and unverified. Reproduce reported bugs. Avoid rebuilding existing work or merging an obsolete branch.
- Other agents and chats may be working in the same repository at the same time. Fetch main and re-read the open PRs again after any pause and before pushing: the branch you built on may have merged, moved or been replaced. Do not push to a branch another agent owns; stack a new branch on it and state the merge order.
- Establish constraints: platforms, accessibility, existing data, privacy, costs, available accounts, and what the user has authorized. Ask only for missing decisions that materially change the work; continue independent investigation.
- Record the baseline and acceptance criteria before implementation. For a large task, keep a short persistent brief using [the brief template](references/brief-template.md).

## 2. Research working versions before feature code

- For a new feature or substantial redesign, compare 3–5 relevant implementations: a strong established tool, the best suitable free option, and a credible open-source option where one exists. Explain the selection; do not invent a free or open-source equivalent to meet a quota.
- Inspect actual workflows, official docs, current API/protocol specifications, code and changelogs. Use user reports to find friction and unmet needs, not to establish technical capabilities. Record URLs, access dates, versions/plans, observations and uncertainty.
- Look for what users value, what makes them abandon or switch tools, and where simpler options already solve the task. Distinguish measured evidence, provider claims and your inference. Do not label something “best” from marketing alone.
- Verify unstable facts such as model names, free tiers, host support and browser restrictions against current primary sources. Prefer integrating or linking an existing tool when that serves the user better; explain what Mess itself adds.
- If a source or real account is inaccessible, record that limitation. Complete independent work and testable parts; do not substitute memory or imply the blocked integration was verified.

**Bounded repair path:** for an isolated bug, copy/layout fix or narrow maintenance change, reproduce it, inspect the existing design and consult the relevant authoritative source or established project pattern. No full competitor study is needed unless the fix changes the workflow, architecture, permissions or product promise. State why this path fits. Research still precedes feature code; scale the depth, not the honesty.

## 3. Break down and fit the complete journey

Write a component table. Group tightly related pieces so the table remains useful:

| Component / user step | Existing behavior | Evidence / reference | Must / should / skip | Product fit and reason | Failure / recovery | Acceptance check |
| --- | --- | --- | --- | --- | --- | --- |

- Cover entry, setup, input, processing, preview, confirmation, saved result, return/revisit and removal or undo. Include the empty state, cancellation, errors, partial results, accessibility and first use.
- Identify dependencies and data contracts before UI implementation. Preserve existing user data; define migrations, duplicate handling, retry behavior, ownership and deletion where relevant.
- For each component decide reuse, integrate, link, build or defer. State cuts and tradeoffs. Do not copy a competitor's entire feature list or build an impressive shell around a missing core.
- In Mess, connect the result to its condition and relevant notes, cards, questions, mistakes, cases and stats. Keep the most useful action first, label controls, fold away extras, and preserve a usable no-AI route.
- Describe the real data flow: what stays on the device, what goes to each provider, and what a new backend changes. Distinguish website, installed app, embedded host and local-model behavior. Product promises must match those boundaries.
- For AI features or connectors, read [the connector checklist](references/connector-checklist.md) and include a capability matrix. Do not call opening an AI website a connection, or an import preview a completed save.

## 4. Share the brief and choose a complete first slice

Give the user the concrete problem, the main evidence, the proposed journey, the key component decisions and remaining uncertainty. Keep the update short; put the full table in the brief when it is large.

Choose the smallest slice that lets the user complete a real task with an observable result and a recovery path. Separate must-have behavior from follow-up improvements. Start authorized implementation when the evidence and scope are sufficient; do not create a ceremonial approval gate. Stop dependent work when a genuinely necessary decision or authorization is missing.

## 5. Implement and test through the result

- Work on an isolated branch or worktree. Make the first slice work across its real boundaries, then add the remaining components. Keep the code in the project's established modules and avoid unrelated rewrites.
- Add focused regression tests for consequential bugs and behavior changes. Exercise new untrusted inputs through the shared validation/escaping path; in Mess extend injection coverage when a new input surface warrants it. Do not add trivial tests that only mirror implementation or demand a new test for every harmless text edit.
- Test success, invalid input, denial, timeout, cancellation, limits, retry, duplicate/partial submissions, persistence, reload and undo as applicable. Assert the saved result, not just a green button or mocked success response.
- For UI work, use it from a fresh state on a 390 px phone and across desktop/laptop widths. Layout bugs hide between breakpoints, so sweep the width range in steps (for example every 20 px from 360 to 2000) and assert the page never scrolls sideways, rather than checking two sizes. Check keyboard/focus, readable labels, navigation, loading and error states. Verify behavior as well as screenshots.
- For integrations, use deterministic contract tests and controlled failure cases, then test with the real service/host when available. Mocks do not prove live compatibility, authorization or free-plan availability. Never use a real patient's data or leak keys into logs, URLs, screenshots or test artifacts.
- Run the relevant existing checks and the required suite. In Mess, normally run `node tests/run.mjs`; for claims-related tooling also run the appropriate `node tools/check-claims.mjs` check. Classify environment failures accurately; do not disable TLS checks or weaken assertions to produce a pass.
- Run the suite before every push, including pushes that only change content or data files: one stray character in a data file can stop the whole app loading. In Mess, leave line 1 of `app/sw.js` as `const C='mess-dev';`: the build stamps the cache name from `app/` (since 27 Nov 2026).

## 6. Review, release within authorization, and hand over

- Recheck acceptance criteria as a new user. Compare implementation, help text and website claims; remove unsupported promises and stale screenshots. Mark unfinished capabilities honestly.
- Review correctness, security/privacy, data loss, accessibility and regressions. For medical content, preserve the separate primary-source checking process and role boundaries. A matching quote is not proof of a complete or current recommendation; check amendments and corrections. The model that wrote a claim is never its only checker: an independent check finds dropped qualifiers and superseded wording that the author's own check passes.
- Update the actual documentation that changed. Do not create or rewrite a product brief or help page merely to satisfy a checklist. Keep research, working notes and source extracts out of public assets; check the deployment boundary when adding files.
- Open or update a focused PR with the problem, resulting behavior, component decisions, validation evidence and limits. Follow the user's current merge/deployment authorization; do not inherit a stale “always merge” or “never merge” rule from this skill. Write the description for the person merging, who may be reading on a phone: what it does in plain words, how to check it, the merge order if PRs are stacked, and what is not done.
- If release is authorized, verify the deployed user journey and relevant asset exclusions. Distinguish local, preview and production results, and provide a rollback path for material changes. After a merge, load the production pages at phone and laptop widths, collect console errors and failed requests, and request a few files that should not be public.
- When a check cannot run where you are (a source refuses the download, there is no real host or account), name the check, what it would have proved and where it can be run. Do not report the reduced result as the full one.
- Report what changed, what was actually tested, unresolved limits and elapsed time. For repeatable content work, separate source extraction, independent checking and human review time; count rows and report minutes per claim without treating speed as evidence of accuracy.

Use [the review scenarios](references/review-scenarios.md) when evaluating or updating this skill. Improve it from observed failures, keeping the main workflow concise and detailed examples in references.
