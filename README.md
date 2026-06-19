# Ladybug AP Stats Vocabulary

Ladybug AP Stats Vocabulary is a simple static classroom tool for AP Statistics vocabulary. It runs entirely in the browser using HTML, CSS, vanilla JavaScript, and a CSV file.

The app opens to a home screen with three tools:

- Teacher Quizlet
- Vocabulary Index
- Practice Flashcards

There is no backend, database, login, student account system, scoring system, or AI feedback.

## Files

- `index.html` contains the page structure.
- `styles.css` contains the ladybug-inspired classroom theme.
- `script.js` loads the CSV and controls the app behavior.
- `data/vocab.csv` contains the vocabulary terms.
- `assets/` contains the images used by the app.

## Teacher Quizlet

Teacher Quizlet is designed for quick classroom vocabulary checks.

It can:

- Load vocabulary from `data/vocab.csv`.
- Build unit and section checkboxes from the CSV.
- Let the teacher select whole units or individual sections.
- Generate 1 to 5 non-repeating terms from the selected sections.
- Hide definitions at first.
- Reveal and hide definitions.
- Regenerate the full quizlet.
- Regenerate one individual term without changing the other displayed terms.
- Prevent duplicate terms in the current quizlet.

## Vocabulary Index

Vocabulary Index is for searching and browsing terms.

It can:

- Build unit and section filters from the CSV.
- Start with no units or sections selected.
- Search concept names and definitions.
- Use whole-word matching so short words do not match inside longer words.
- Combine search text with selected unit and section filters.
- Clear the search box.
- Show concept, definition, unit, and section for each result.

## Practice Flashcards

Practice Flashcards is for studying terms one at a time.

It can:

- Build unit and section filters from the CSV.
- Start with no units or sections selected.
- Build a deck from selected sections.
- Show one card at a time.
- Flip between concept and definition.
- Move to previous and next cards.
- Shuffle the current deck.
- Show card progress.

## CSV Format

The app loads vocabulary from:

```text
data/vocab.csv
```

The CSV must use these columns:

```csv
unit,section,concept,definition
```

All CSV values are treated as strings. You can replace `data/vocab.csv` with a larger file later as long as it uses the same columns.

## Run Locally

Because the page loads a CSV file, open it through a local server instead of double-clicking `index.html`.

From this folder, run:

```bash
python -m http.server
```

Then open:

[http://localhost:8000](http://localhost:8000/)

## GitHub Pages

This app is ready to publish with GitHub Pages because it is a static site.

Upload these live app files and folders:

- `index.html`
- `styles.css`
- `script.js`
- `README.md`
- `data/`
- `assets/`

You do not need to upload local working folders such as `work/` or `outputs/` for the live site.

After uploading to GitHub, enable GitHub Pages from the repository settings and publish from the main branch.

## Notes

- The app is designed for classroom use and projection.
- The image files in `assets/` have been resized for faster loading.
- Larger original image backups are stored outside the live `assets/` folder in `outputs/original-large-images-20260619`.
