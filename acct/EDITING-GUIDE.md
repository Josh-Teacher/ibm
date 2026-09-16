# Accounting — 15 lecture presentations

Open **START-HERE.html** in a current browser to present the complete course offline. The **lectures** folder contains one HTML file that starts on each week. Every portable file carries the whole course, so its lecture menu still works if you copy only that file to another computer.

## Presenting

- Bottom **← / →** buttons or arrow keys: move through slides.
- **Lectures**: choose a week. **Slides**: jump within the current lecture.
- **A− / A+**: adjust slide text from 80% to 160%. Enlarged content reflows and can scroll, while bottom controls stay available. **Fit** restores 100%.
- **Reveal answer**, or **R**: switch between a question and its worked answer. Answers start hidden on slide changes.
- **F**: full screen. Use the browser’s full-screen command if it restricts this feature.
- **Notes**: instructor prompts, sources, case handout, and **Print lecture with answers**. This dialog appears on the presentation screen; review it before class if you do not want to project it.
- Shortcuts: **L** lectures, **I** slides, **N** notes, **Home / End** first/last slide, **+ / −** text size, **Esc** close dialogs.

Each lecture has nine core slides, including examples, practice, and discussion prompts. The handout supports independent work. Weeks 8 and 15 are consolidation modules that can fit around examinations.

## Where to edit

The **editable-site** folder holds the source. Edit it rather than the embedded copies inside portable HTML.

| File | Purpose |
| --- | --- |
| `course.json` | Lecture order, menu titles, palette, and source references |
| `content/week-01.json` … `content/week-15.json` | Each lecture’s text, examples, answers, and notes |
| `content-schema.json` | Description of the JSON structure |
| `styles.css` | Shared typography, spacing, responsive layouts |
| `app.js` | Shared slide renderer and controls |
| `index.html` | Presentation shell and bottom navigation |
| `data/teaching-case.json` | Summit Trail events, entries, and check totals |
| `data/ratio-case.json` | Cedar’s two-year figures |
| `data/review-case.json` | Harbor’s cumulative review case |

JSON uses double quotes and does not accept trailing commas or `//` comments. Use an ignored `_comment` field for your own notes. The supplied files include these comments. Text is displayed literally: HTML and Markdown are not interpreted. Numeric display labels are strings such as `"8,840"`, giving you control over commas, signs, and units.

Copy an existing slide with a suitable layout, change its text, and give it a unique ID. Move objects within the `slides` array to reorder them; the slide count and index update automatically. Keep an existing slide’s ID when you want saved links to remain valid.

```json
{
  "id": "w02-10",
  "type": "practice",
  "_comment": "Optional extra example.",
  "title": "Try it: collect a receivable",
  "lead": "A customer pays $500 on an existing invoice.",
  "blocks": [{ "type": "text", "text": "Which two accounts change?" }],
  "answer": {
    "blocks": [{
      "type": "table",
      "columns": ["Account", "Debit ($)", "Credit ($)"],
      "rows": [["Cash", "500", ""], ["Accounts Receivable", "", "500"]]
    }],
    "takeaway": "Collection does not create revenue again."
  },
  "notes": "Ask students why revenue does not change.",
  "sources": ["openstax"]
}
```

Supported blocks: `text`, `bullets`, `table`, `splitTables`, `compare`, `sequence`, `equation`, `fraction`, `statement`, and `taccounts`. Existing lectures contain examples of each. An `answer` has its own `blocks` and optional `takeaway`; it replaces question content when revealed. `notes` may be one string or several paragraphs in an array. Source IDs refer to `course.json`.

**Changing case data does not automatically recalculate slide amounts.** The statements and worked answers are explicit teaching text. Update related entries, balances, statements, answers, and ratios together. The numeric data files regenerate the case handout. Pine’s short handout is defined in `build-offline.mjs`; change it there if you revise Week 8’s mini-case.

## Regenerate the portable files

With Node.js installed, run this from the downloaded package folder after editing the source:

```bash
node build-offline.mjs
```

No package installation or internet connection is needed. The script regenerates `START-HERE.html`, all weekly HTML files, and `case-handout.html`, preserving your JSON changes. If it reports a JSON syntax error, fix the named file and run it again.

The hosted `index.html` reads JSON directly. Publish your revised source and regenerated offline downloads to update the online course. For direct local use, open `START-HERE.html`: browsers commonly block JSON fetches from a local `index.html` file.

## Palette and course conventions

The semester moves through blue/cyan/teal in Weeks 1–3, green in Weeks 4–6, yellow/gold in Weeks 7–9, orange/coral in Weeks 10–12, and burgundy/plum in Weeks 13–15. The light slide surface and dark text stay consistent. In `course.json`, each accent has darker `ink`, pale `soft`, and contrasting `onColor` values; update those together when changing colors.

The main case is a corporation with Common Stock, Retained Earnings, and Dividends. Inventory is perpetual with supplied costs. No adjusting entries, adjusted trial balance, or closing entries are required. The simplified statements do not claim full compliance with every reporting standard.

Interest paid is operating; dividends and loan principal paid are financing. Quick assets exclude inventory and prepayments. The cash ratio uses cash and cash equivalents. Debt-to-equity uses all liabilities. ROA and asset turnover use average beginning and ending assets. The conventions are explicit on the relevant slides.

Week 14 uses Apple’s fixed-year 2025 Form 10-K, with direct links in Notes. Recheck dated standards context and company examples when preparing a future edition. Classroom cases remain separate from the assessed datasets.
