# Mess packs

A pack is a file of study content that anyone can add to Mess: flashcards, questions, notes for topic pages, new topics, OSCE stations and mnemonics. Students, societies and teachers can make them. Students add them in one tap from **Topics → More → Packs**.

Packs are data only. A pack can never run code, so a bad or broken pack can't break Mess. Everything in a pack is checked and capped when it's added, kept under the pack's own id, and removed cleanly with **Remove**. A student's own notes and cards are never touched.

## Make a pack

The easy way: build it in Mess. Add your notes, cards and questions, then go to **Topics → More → Packs → Make your own pack**. Mess downloads a pack file of everything you've added.

You can also write the file by hand. It's JSON:

```json
{
  "mess": "pack",
  "format": 1,
  "id": "renal-in-10-minutes",
  "name": "Renal in 10 minutes",
  "version": "1",
  "author": "Your name or society",
  "description": "One or two lines on what's in it.",
  "licence": "CC BY 4.0",
  "source": "https://link-to-where-it-lives",

  "notes": {
    "Acute kidney injury": {
      "Management": ["One short point", "Another point"]
    }
  },
  "cards": [
    { "f": "Question", "b": "Short answer", "topic": "Acute kidney injury" }
  ],
  "questions": [
    {
      "stem": "The question",
      "opts": ["A", "B", "C", "D", "E"],
      "a": 2,
      "why": "Why C is right",
      "topic": "Acute kidney injury"
    }
  ],
  "topics": [
    { "name": "A topic Mess doesn't have", "kind": "c", "area": "Renal and urology", "rel": ["Linked topic"], "drugs": ["A drug"] }
  ],
  "mnemonics": ["One mnemonic or teaching point per line"],
  "stations": [],
  "stories": {
    "Asthma": {
      "shape": "mechanism",
      "idea": "One or two sentences: the big idea everything else follows from.",
      "steps": [
        { "h": "Pathophysiology", "pts": ["A point, ending with its source [NICE NG245]", { "t": "A point [source]", "why": "Why it matters clinically, for students who don't see it yet" }] },
        { "h": "Clinical features", "bridge": "How this step follows from the last one", "pts": ["..."], "more": ["Deeper points, folded under Go deeper"] }
      ],
      "remember": ["Up to 3 lines: if you remember nothing else"]
    }
  }
}
```

- **id**: lowercase letters, numbers and dashes. Keep it the same when you update the pack, and raise **version**.
- **topic** and the keys in **notes**: use Mess's topic names exactly (they're on the Topics page) so things land in the right place. Note sections are the tabs on a topic page: What it is, Pathophysiology, How it presents, Investigations, Management, Complications and red flags, What it gets confused with.
- **kind** for new topics: `c` for a condition, `d` for a drug.
- **a** in questions counts from 0, so 2 means the third option.
- **stories** tell a topic in the order that builds understanding: the big idea, then steps that each follow from the last, then what to remember. They show on topics that don't have one of Mess's own, labelled as coming from your pack. Write the meaning first, in your own words, and end every point with its source.
- Leave out any part you don't need.
- Limits: 5 MB, 5,000 cards, 2,000 questions, 300 stations.

## Add it to the library

The library is the list every student sees in Mess. To add your pack:

1. Put your file in `packs/`, named `something.mess-pack.json`.
2. Add it to `packs/index.json` with the same id and version. If the pack is made for particular topics, list them as `"topics": ["COPD"]` (Mess's topic names exactly): students then see it offered on those topic pages, and add it in one tap.
3. Open a pull request. A check runs automatically (`node tools/check-packs.mjs`), then it's reviewed and merged.

## Rules

Everything in the library is public and free, so:

- **Your own words only.** Never paste from question banks, textbooks or past papers.
- **No patient details**, ever.
- **A licence that lets students use it**, such as CC BY 4.0.
- **Say where it comes from** if it's adapted from somewhere that allows it, and credit them.
- **Keep it accurate.** UK guidance (NICE, BNF) where it applies. Packs that go out of date may be taken down until they're fixed.
