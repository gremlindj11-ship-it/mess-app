# How Mess looks and behaves

Every screen should feel like the same calm, careful app. `tests/ui-audit.test.js` checks the rules marked ✓ automatically on every page, pop-up and mode, on a phone and a computer. Run it with the other tests (`node tests/run.mjs`).

## Principles
1. **The most useful thing goes at the top.** One primary action per screen (`btn pri`); everything else is secondary.
2. **Fold away anything not needed,** behind a labelled fold ("More ▾", "Go deeper ▾"). Never show extras all at once.
3. **It must be obvious where things are:** labelled buttons, never a bare icon unless it has an aria-label and a title. ✓
4. **Everything shown works.** If it can't, remove it. ✓ (every `data-a` has an action; no buttons without an action)
5. **Say it plainly.** Labels say what happens: "Bring in your notes", not "Submit", "OK" or "Click here". ✓
6. **Each action appears once per screen,** unless it's a row in a list. ✓ (flagged to look at)

## Components (use these, don't invent new ones)
| Need | Use |
|---|---|
| Main action | `button.btn.pri` |
| Other actions | `button.btn` (`.sm` in tight spots) |
| A light action inside text | `button.tlink` |
| A menu of extra actions | `details.dd > summary.btn` with a `.ddmenu` of `role="menuitem"` buttons, each with a `<b>` title and a `<small>` line saying what it does |
| A fold inside a page | `details.dd.ddinline > summary.tlink` ending in ▾ |
| Pick one of a few | `button.seg` (`.on` for the current one) |
| Topic and drug chips | `button.tag` |
| Text inputs and dropdowns | `.f`. Never a browser-default `<select>` ✓ |
| A card | `.card`, or `.sstep` in stories |
| A pop-up box | `.overlay` > `.mbox.ibox` with an `.ihead` and a × close |
| A message after an action | `toast()`. Short, and it says what happened |

- **Sources fold (25 Nov 2026).** No source label after a point, in a table, under a diagram or anywhere in the reading text. Every page that states facts ends with one closed fold, "Sources (n)": first each source once, with the credit line its licence asks for and a link; then a second fold, "Which source each point comes from", step by step. The label, source and exact quote stay in the data and the checks do not change. Never remove the fold to save space, and never put a credit line only on another page: the open licences ask for credit where the words are used. Mono `--t0` is still only for source labels, which now live inside the fold.

## Look
- **Colours** only from the theme variables: `--bg`, `--surface`, `--line`, `--text`, `--muted`, `--acc`, `--on`, `--soft`. No hard-coded blues, and no browser-default link colours. ✓
- **Icons:** Lucide (ISC), stroke 1.75, 22–24 px.
- **Type:** Bricolage Grotesque for headings, Geist for text, Geist Mono for times and numbers.
- **Corners:** 4–8 px on cards and buttons, 10–14 px on sheets.
- **Shadows:** soft, only on things that float (pop-ups, sheets, the ? button).
- **Capital letters** at the start of labels; no full stops on button labels.

## Phones (under 760 px)
- **Navigation:** a bottom bar (Today, Practice, Stats, Topics, More); no side rail.
- **Tap targets** are at least 34 px. ✓ (anything under 32 px is flagged)
- **No sideways scrolling,** neither of the page nor of boxes inside it. ✓ Use a dropdown or a vertical layout instead (e.g. the day timeline goes vertical on phones).
- **No small scroll boxes inside the page** unless they're meant to scroll (chat, menus). ✓ (flagged to look at)
- **Leave room for the bottom bar:** pages pad the bottom; floating things sit above the bar and the iPhone home indicator.
- **No customising toolbars** (highlighters, reading style) on phones. Customise on a computer; the results still show.

## Words
- UK spelling. Short sentences. Say what something does and what happens next.
- Be honest about status: "not written yet", "Draft written by AI", "Needs the AI".
- Never claim to beat a better free tool; point to it.

## The website (index.html, help.html, site.css)
The home page follows these so nothing is placed by eye. The values live at the top of `site.css`.
- **One edge.** The top bar, every section and the footer share the same left and right edge (`--edge`, 1180 px wide). Text starts on that edge; nothing is nudged in or out.
- **One box.** White, 12 px corners (`--r`), 24 px inside (16 px on phones), no shadow. Controls inside a box (buttons, options, rows) use 6 px (`--rc`). Pills are fully round. The question card is the only box with the yellow offset.
- **Spaces** come from 8, 16, 24 and 40 px, with `--sec` between sections and `--gap` between two columns. Boxes in a row share their top and bottom edges, and a box that swaps its contents keeps its height.
- **Only paper tilts:** the scraps and the handwriting. Everything else is square to the page.
- **Type:** Bricolage for headings, Geist for everything else, including times and numbers (tabular). Mono only for source labels.
- **A link shows the way back.** When you follow a link from one topic to another, the page you land on picks out the link back in yellow and opens the fold it sits in. Where that link is below the first screen (a phone), the page also says where you came from under its title. It lasts until you go somewhere else.
- **The ? closes when you click away.** A click or tap outside the panel, or Escape, closes it. The click still does its job.
- **Movement means something.** The full stop runs along the name and lands; the highlights heading changes with its screen. Anything that moves by itself stops when you take over, and nothing moves with reduced motion on.
- **Words:** short, plain, a bit of wit. The joke is always the mess.
- **Type scale.** Sizes come only from the tokens at the top of `site.css`: `--t0` 12.5 px (mono source labels and counts), `--t1` 14 px (keys and footnotes), `--t2` 15 px (small text, pills, captions), `--t3` 17 px (body), `--t4` and `--t5` (lead paragraphs), and `--d1`…`--d6` for Bricolage headings, largest to smallest. Weights are 400 for text, 500 for small labels, 600 for strong labels and buttons, 700 for headings. Times and numbers are Geist with tabular figures, not mono.
- **Pills** take the page background inside a white box and the white surface on the page itself, so they always read as raised off what's behind them.
