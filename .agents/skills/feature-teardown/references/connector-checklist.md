# AI and connector teardown

Read before proposing, changing or reviewing AI integrations. Start with the student's intended journey, not a list of provider logos. Research current official provider and protocol docs before fixing the architecture or promising availability.

## Separate the connection types

- **Manual handoff:** copy prompt → open provider → student submits → paste answer → validate → preview → save. No account connection is implied. Test clipboard denial, blocked tabs, long prompts, provider opening empty and interrupted return.
- **Direct API:** Mess makes a request using the configured provider credentials. Verify supported endpoint, current models, browser CORS/CSP, streaming, structured output, file/audio support, billing and limits. A chat subscription does not by itself establish API entitlement or available credit; verify the actual account/product.
- **Local model:** verify endpoint, device/network reachability, browser restrictions, authentication if any, capabilities and the difference between desktop and phone access. Do not silently expose a local service to the internet.
- **Host-provided AI:** verify the host's documented runtime and actual capability negotiation. Detect capabilities and failures, rather than inferring an authenticated provider account from being embedded or having a callback. Do not assume a callback identifies a particular provider.
- **MCP or another tool connector:** verify the protocol/version, transport, supported host and plan, authentication model, origin rules, schemas, lifecycle and cancellation. Tool availability in one host does not prove another host supports its UI or actions. Public read-only content and access to a student's private local data are different architectures.

## Capability matrix

Record each meaningful host/provider/platform combination, grouping only when behavior is actually shared.

| Route / host / platform | Official evidence and date | Setup / auth / plan / cost | Read / generate / save capabilities | Data leaving device | Status / verification | Honest fallback |
| --- | --- | --- | --- | --- | --- | --- |

Statuses: verified on real host, contract-tested only, documented but untested, unsupported, or unknown. Do not guess support to make the table look complete. Avoid hard-coded quota/model claims without current evidence.

## Trace one complete round trip

For Mess: topic → learning request → provider/host → structured result → return to Mess → import validation → student preview/confirmation → local save → discover in the topic/practice view → reload → undo/remove.

- At every transition, identify the payload, trust boundary, owner and state. Define cancelled, failed, partial and expired behavior.
- Clearly separate prepared, opened, awaiting confirmation, saved and failed. Report success only after the authoritative save acknowledgment; the AI must not tell the student data was saved when it only prepared a link.
- Validate schemas, counts, lengths, types and topic matching; reject dangerous content, links and oversized payloads before rendering/saving. Preserve uncertainty/source status for generated clinical material.
- Define duplicate/replay handling, retries, partial acceptance and idempotency where writes can repeat. Keep imports recoverable and confirm the resulting records after reload.
- Treat imported text, retrieved pages and tool outputs as data, not instructions. Test prompt injection and unauthorized tool calls as well as HTML/script injection. Use narrow tool permissions and confirmations appropriate to the action.
- Determine whether a stateless connector can perform the promised operation. Local browser storage is not automatically readable or writable by a remote server. Explain any pairing, sync, account or backend requirement before building it.
- Verify host UI support separately from plain tool results. Provide an ordinary, usable return/import path if embedded cards or buttons are unsupported.

## Privacy and reliability

- Document exactly what each service receives, what is stored, and how disconnect/delete works. No blanket “everything stays on device” promise when prompts or files leave it.
- Keep keys, tokens and sensitive content out of query strings, logs, analytics, screenshots, committed files and backups that are not intended to contain them. Assess fragments, browser history, clipboard and sharing separately: absence from an HTTP request does not mean a link is private everywhere.
- Test no credentials, expired/revoked credentials, denied permission, unavailable model, malformed response, rate limit, timeout, network interruption, host reload and rejected save. Preserve the student's work and provide a clear next action.
- Verify timeout/retry/cancellation behavior and cost limits. Do not silently switch provider, send more data, incur new charges or repeat a write to hide a failure.
- Preserve a useful no-AI route and a manual fallback. Unsupported should be stated before the student spends time setting up a connection.

## Evidence required before release

At minimum: a repeatable contract test, a complete local round trip including reload/undo, failure recovery, responsive UI, safe rendering and data-flow review. Test real host authentication and tool/save behavior when access exists. If access does not exist, say which route is unverified and keep its claims limited; mocks alone do not justify “works with every AI” or “connected to your account”.
