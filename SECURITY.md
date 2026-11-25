# Security

## Reporting a problem

If you find a way to break into Mess, get at someone's data, or run code through it, please email **hello@messmed.co.uk** rather than opening a public issue. Say what you found and how to reproduce it. You'll get a reply, and credit if you want it.

## How Mess protects students

- **No server, no accounts.** Everything a student adds stays in their own browser. There's no database of students to steal.
- **AI keys stay on the device.** They're stored separately, never included in backups or packs, and only sent to the AI company the student picked.
- **A strict content security policy.** Mess only runs its own scripts. Injected scripts, inline code and other sites' scripts are blocked by the browser, and Mess can't be put inside another site's frame.
- **Visits are counted on the website only, never inside Mess.** The home page and Help count visits with Cloudflare Web Analytics: no cookies, nothing stored on the device, and a switch on the Help page turns it off. Nothing under `app/` may load a counter, and Mess's own policy blocks the counting script there even if Cloudflare is set to add it to every page. `tests/site-visits.test.js` checks this.
- **Everything shown is escaped.** Notes, AI replies, emails, packs and backups are all treated as text, never as code.
- **Packs are data only.** They can't run code. Every field is checked and size-capped, risky search patterns are neutralised, and each pack can be removed cleanly.
- **Backups are checked before they're restored.** Unknown or malformed settings are dropped.
- **AI is told to ignore instructions hidden in material.** Lectures, emails and documents are passed to the AI as data.
- **Library packs are checked automatically** for broken files, patient numbers and copied question-bank material before they can be merged.

## For maintainers

- Keep two-factor login on for every account with access to the repo, Cloudflare and Fasthosts.
- Protect the `main` branch: changes go through pull requests, and the checks have to pass.
- Turn on GitHub secret scanning and Dependabot alerts.
- Never commit keys or `.env` files.
