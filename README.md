# Mess

**Revision's a mess. This one's free.**

Mess is a study hub for UK medical students. Open any condition and get the notes, questions, flashcards, OSCE stations and your own placement cases in one place. Edit all of it, add your own, and let AI help if you want it.

No fees, no ads, no sign-up. Your data stays on your device.

Revising for medical finals shouldn't depend on what you can afford. Mess is built especially for students who struggle to pay for revision resources.

## What's in it

- **Topics:** a web of conditions and drugs, linked to each other and to everything you do. Change the notes or add your own topics.
- **Practice:** OSCE stations, questions, prescribing, flashcards and a consultant to talk things through with.
- **Stats:** see what you've done and where you're weakest.
- **Placement:** write up your cases, which link to topics automatically.
- **Today:** your day, your tasks and what to do next.
- **Lectures:** drop in slides, PDFs or Word files, and Mess sorts them into topics, notes, flashcards and questions.
- **Your way of reading:** bold key words, short lines, text size, highlighters and colours.
- **Anki:** download your cards for Anki, bring in your own export, or add your Anki deck file to see which topics you keep forgetting.
- **Any AI you already have, or none:** use ChatGPT, Claude, Gemini, Copilot, Perplexity, Grok, Mistral, DeepSeek or Meta AI on whatever plan you've got. Mess writes the prompt, and you paste the answer back. Or connect a key, including free ones, or an AI on your own computer. Topic chat can restrict answers to the source-backed notes Mess has for that topic and show the evidence used. Everything else works with no AI at all.

Mess is a study tool. It isn't clinical guidance, and grounded chat only uses the notes currently deployed for that topic. Check anything you'd act on against current guidelines and the BNF.

## Run it

There's no build step. The website is in the top folder, and the app is in `app/`. Download the code and serve the folder:

```
npx serve .
```

Then open the address it prints.

Or just use it at [messmed.co.uk](https://messmed.co.uk).

## How the code is laid out

The app is plain JavaScript in `app/js/`, one file per page plus the shared parts. They load in order from `app/index.html` and share one global scope, so there's still no build step.

- Pages: `today.js`, `practice.js`, `stats.js`, `topics.js`, `placement.js`, `profile.js`, `intro.js`, `tools.js`
- The core: `links.js` (what links to what), `safety.js` (escaping, cleaning, checks), `intake.js` (the one way in: file checks, zip and PDF safety, patient details out, undo), `flow.js` (moving around, the ? panel), `store.js` (saving and loading), `grounding.js` (source-aware topic answers)
- Engines: `ai.js`, `import.js`, `packs.js`, `diagrams.js`, `apps.js`
- `boot.js` runs last and starts everything.

Every button names an action (`data-a="..."`), and each file adds its own actions with `Object.assign(act, {...})`.

## Tests

Run `npm install` once, then `npm test`. This runs every check: no errors on any page, phone layout, importing cards, questions and stations, diagrams (including a harmful SVG), lecture recordings, Why was I wrong?, the ? without AI, damaged backups and the way in (fake files, zip bombs, patient details, undo). Playwright also needs Chromium once: `npx playwright install chromium`. Run the tests before and after any change.

## Your data

Everything you add is saved in your browser, on your device. It isn't sent to us, because there's no server to send it to. If you use AI, what you ask goes to the AI provider you chose. Back up from Profile, as clearing your browser data clears Mess too.

Mess takes NHS numbers, hospital numbers and dates of birth out of anything brought in, and names and contact details out of anything sent to an AI. It catches the usual identifiers, not everything, so still don't put identifiable patient details into your case write-ups.

## Packs

Anyone can make study content for Mess and share it: flashcards, questions, notes, topics, OSCE stations and mnemonics. Students add packs in one tap, and remove them just as easily. Packs are data only, so they can't break anything. See [PACKS.md](PACKS.md) to make one or add it to the library.

## Contributing

Corrections and new notes are very welcome. Report a problem with the ? in the app, or open an issue here.

Everything added here is public, so please:

- write in your own words, and never paste from question banks, books or past papers
- never include patient details
- only add content from other projects if its licence allows it, and credit them

## Security

No server, no accounts, and a strict content security policy. See [SECURITY.md](SECURITY.md), and report problems privately to hello@messmed.co.uk.

## Credits

Mess is built on other people's generous work.

- [Rough.js](https://github.com/rough-stuff/rough) (MIT): hand-drawn graphics
- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT): flashcard scheduling
- [PDF.js](https://github.com/mozilla/pdf.js) (Apache-2.0): reading PDFs
- [Mermaid](https://github.com/mermaid-js/mermaid) (MIT): diagrams
- [JSZip](https://github.com/Stuk/jszip) (MIT): reading PowerPoint and Word files
- [sql.js](https://github.com/sql-js/sql.js) (MIT): reading Anki deck files
- [fzstd](https://github.com/101arrowz/fzstd) (MIT): unpacking newer Anki files
- [Lectern](https://github.com/stegra05/Lectern) (MIT, © 2026 Steffen Grabert): the lecture pipeline Mess adapts: concept map first, cards in batches guided by what is still uncovered, each card checked against the slide it cites, near-duplicate checks and a gap-filling pass
- [Lucide](https://lucide.dev) (ISC): sidebar icons
- [jalliet/flashcards](https://github.com/jalliet/flashcards) (MIT): the idea behind lecture flashcards in three layers (recall, why, traps), one fact per card

## Licence

Copyright (c) 2026 Sofia Vidal. Mess is free software under the [GNU AGPL v3](LICENSE): you can use, change and share it, but if you share or host a changed version, you must share your code under the same licence. The projects above keep their own licences.

**Notes, stories and other written content** (in `app/assets/notes.js`, `app/assets/stories.js`, `content/` and Mess's own packs) are under [CC BY-SA 4.0](CONTENT-LICENSE.md): anyone can share, translate and adapt them, including commercially, as long as they credit Mess and release their version under the same licence. That keeps every copy open. Curriculum labels belong to their publishers (e.g. the GMC's MLA content map, reproduced with acknowledgement) and aren't covered.

Made by Sofia Vidal, a medical student at the University of Manchester.

Contact: hello@messmed.co.uk

The Mess name and logo aren't covered by the code licence. If you build on Mess, give it a different name.
