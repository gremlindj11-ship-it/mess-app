# Feature teardown v3

A shared build workflow for Codex and Claude. The canonical instructions are in [SKILL.md](SKILL.md); detailed templates and checks are in `references/`.

## In this repository

`AGENTS.md` and `CLAUDE.md` point to the same `.agents/skills/feature-teardown/SKILL.md`. Use it for Mess app, website and connector work, including reviews and backlog items. Those pointers make the intended default explicit rather than relying only on automatic skill selection.

The files are on the skill-update branch until its PR is merged. They do not become part of main just because a skill was read in the current conversation. No hosted account-wide installation has been performed.

## Reuse in another project

- **Codex repository:** copy the `feature-teardown/` folder into that repository's `.agents/skills/`. Add a brief project instruction referring to it if it should be the default build workflow. Invoke it explicitly with `$feature-teardown` when supported by the client.
- **Codex personal installation:** install the same folder into your own `~/.agents/skills/` to make it discoverable across repositories. This must be done in the environment where you actually use Codex; installing in a temporary cloud checkout does not change your other sessions. Do not overwrite an existing version without comparing it.
- **Claude custom skill:** use the standalone skill ZIP, which contains `feature-teardown/SKILL.md` and its references. Import it through a Claude surface that supports custom skill uploads. The package has not been imported or tested in your Claude account from this session.
- **Claude plugin:** the separate plugin ZIP preserves the uploaded package's layout: `.claude-plugin/plugin.json` and `skills/feature-teardown/`. Use a Claude surface that accepts that plugin format; a plugin archive and a standalone custom-skill archive are not interchangeable.
- **Claude Code:** this repository's `CLAUDE.md` directs the agent to the canonical skill. For another repository, copy the folder and add a matching project instruction or install the plugin through that client's supported workflow.

Avoid installing two copies with the same skill name in one scope. A platform's automatic selection is not a guarantee that every future conversation loads the skill; keep the project instruction or explicitly invoke it when needed.

## What v3 changes

Adds current-code/PR inspection, measurable outcomes, evidence provenance, a complete user journey, capability verification for each integration route, realistic failure/undo behavior, tests proportional to risk, and release rules that follow the user's actual authorization. It retains research before feature implementation and the original component-by-component approach.

See [REVIEW.md](REVIEW.md) for the review, evaluation limits and first application to Mess's connectors. No application feature code was changed while preparing this skill.

## v3.1 (13 November 2026)

Seven additions from the first two days of use on Mess, each from something that actually went wrong or was nearly missed: re-check main and open PRs after a pause and never push to another agent's branch; sweep screen widths instead of checking two sizes (a home page note overflowed only between 901 and 1640 px); run the suite before every push and bump the cache version; an independent checker for every claim (a second model found five errors the author's check had passed, including a superseded NIV rule); PR descriptions written for the person merging; a production check after merging, including files that should not be public (`content/` and `tools/` were being served); and naming any check that could not run and where it can. No evaluation against v3 was run.
