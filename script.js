const CSV_PATH = "data/vocab.csv";
const REQUIRED_COLUMNS = ["unit", "section", "concept", "definition"];

const sectionGroupsEl = document.querySelector("#sectionGroups");
const termCountEl = document.querySelector("#termCount");
const generateButton = document.querySelector("#generateButton");
const revealButton = document.querySelector("#revealButton");
const messageEl = document.querySelector("#message");
const termsListEl = document.querySelector("#termsList");
const homeScreenEl = document.querySelector("#homeScreen");
const teacherScreenEl = document.querySelector("#teacherScreen");
const vocabularyIndexScreenEl = document.querySelector("#vocabularyIndexScreen");
const practiceFlashcardsScreenEl = document.querySelector("#practiceFlashcardsScreen");
const teacherQuizletChoice = document.querySelector("#teacherQuizletChoice");
const vocabularyIndexChoice = document.querySelector("#vocabularyIndexChoice");
const practiceFlashcardsChoice = document.querySelector("#practiceFlashcardsChoice");
const backHomeButtons = document.querySelectorAll(".back-home-button");
const indexSectionGroupsEl = document.querySelector("#indexSectionGroups");
const vocabSearchEl = document.querySelector("#vocabSearch");
const clearSearchButton = document.querySelector("#clearSearchButton");
const indexResultsCountEl = document.querySelector("#indexResultsCount");
const indexResultsListEl = document.querySelector("#indexResultsList");
const flashcardSectionGroupsEl = document.querySelector("#flashcardSectionGroups");
const flashcardMessageEl = document.querySelector("#flashcardMessage");
const flashcardProgressEl = document.querySelector("#flashcardProgress");
const flashcardCardEl = document.querySelector("#flashcardCard");
const flashcardSideLabelEl = document.querySelector("#flashcardSideLabel");
const flashcardTextEl = document.querySelector("#flashcardText");
const previousFlashcardButton = document.querySelector("#previousFlashcardButton");
const flipFlashcardButton = document.querySelector("#flipFlashcardButton");
const nextFlashcardButton = document.querySelector("#nextFlashcardButton");
const shuffleFlashcardButton = document.querySelector("#shuffleFlashcardButton");

let vocabulary = [];
let definitionsVisible = false;
let hasGenerated = false;
let currentTerms = [];
let flashcardDeck = [];
let currentFlashcardIndex = 0;
let flashcardShowingDefinition = false;

document.addEventListener("DOMContentLoaded", () => {
  showScreen("home");
  loadVocabulary();
});
generateButton.addEventListener("click", generateQuizlet);
revealButton.addEventListener("click", toggleDefinitions);
teacherQuizletChoice.addEventListener("click", () => showScreen("teacher"));
vocabularyIndexChoice.addEventListener("click", () => {
  showScreen("index");
  renderVocabularyIndexResults();
});
practiceFlashcardsChoice.addEventListener("click", () => {
  showScreen("flashcards");
  rebuildFlashcardDeck();
});
backHomeButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen("home"));
});
vocabSearchEl.addEventListener("input", renderVocabularyIndexResults);
clearSearchButton.addEventListener("click", () => {
  vocabSearchEl.value = "";
  renderVocabularyIndexResults();
  vocabSearchEl.focus();
});
flashcardCardEl.addEventListener("click", flipFlashcard);
flipFlashcardButton.addEventListener("click", flipFlashcard);
previousFlashcardButton.addEventListener("click", showPreviousFlashcard);
nextFlashcardButton.addEventListener("click", showNextFlashcard);
shuffleFlashcardButton.addEventListener("click", shuffleFlashcardDeck);

function showScreen(screenName) {
  homeScreenEl.hidden = screenName !== "home";
  teacherScreenEl.hidden = screenName !== "teacher";
  vocabularyIndexScreenEl.hidden = screenName !== "index";
  practiceFlashcardsScreenEl.hidden = screenName !== "flashcards";
}

async function loadVocabulary() {
  try {
    const response = await fetch(CSV_PATH, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load ${CSV_PATH}`);
    }

    const csvText = await response.text();
    vocabulary = parseVocabularyCsv(csvText);
    renderSectionCheckboxes(vocabulary);
    renderVocabularyIndexFilters(vocabulary);
    renderVocabularyIndexResults();
    renderFlashcardFilters(vocabulary);
    rebuildFlashcardDeck();
  } catch (error) {
    console.error(error);
    showMessage(
      "The vocabulary CSV could not be loaded. If you opened the file directly, try running the site through a local server or GitHub Pages."
    );
    sectionGroupsEl.innerHTML = "";
    sectionGroupsEl.append(createTextBlock("Unable to load sections."));
    indexSectionGroupsEl.innerHTML = "";
    indexSectionGroupsEl.append(createTextBlock("Unable to load sections."));
    indexResultsCountEl.textContent = "";
    indexResultsListEl.innerHTML = "";
    indexResultsListEl.append(createTextBlock("Unable to load vocabulary terms."));
    flashcardSectionGroupsEl.innerHTML = "";
    flashcardSectionGroupsEl.append(createTextBlock("Unable to load sections."));
    flashcardMessageEl.textContent = "Unable to load vocabulary terms.";
    setFlashcardControlsEnabled(false);
    generateButton.disabled = true;
    revealButton.disabled = true;
  }
}

function parseVocabularyCsv(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((value) => value.trim() !== ""));

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const columnIndexes = Object.fromEntries(
    REQUIRED_COLUMNS.map((column) => [column, headers.indexOf(column)])
  );

  const missingColumns = REQUIRED_COLUMNS.filter((column) => columnIndexes[column] === -1);

  if (missingColumns.length > 0) {
    throw new Error(`Missing CSV columns: ${missingColumns.join(", ")}`);
  }

  return rows.slice(1).map((row) => ({
    unit: String(row[columnIndexes.unit] ?? "").trim(),
    section: String(row[columnIndexes.section] ?? "").trim(),
    concept: String(row[columnIndexes.concept] ?? "").trim(),
    definition: String(row[columnIndexes.definition] ?? "").trim()
  }));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  rows.push(row);
  return rows;
}

function renderSectionCheckboxes(rows) {
  sectionGroupsEl.innerHTML = "";

  const groups = buildSectionGroups(rows);

  if (groups.size === 0) {
    sectionGroupsEl.append(createTextBlock("No sections were found in the vocabulary CSV."));
    return;
  }

  groups.forEach((sections, unit) => {
    const groupEl = document.createElement("fieldset");
    groupEl.className = "unit-group";

    const legendEl = document.createElement("legend");
    legendEl.className = "unit-title";

    const unitLabelEl = document.createElement("label");
    unitLabelEl.className = "unit-option";

    const unitInputEl = document.createElement("input");
    unitInputEl.type = "checkbox";
    unitInputEl.className = "unit-checkbox";

    const unitTextEl = document.createElement("span");
    unitTextEl.textContent = unit ? `Unit ${unit}` : "Unit Not Listed";

    unitLabelEl.append(unitInputEl, unitTextEl);
    legendEl.append(unitLabelEl);
    groupEl.append(legendEl);

    const listEl = document.createElement("div");
    listEl.className = "checkbox-list";

    sections.forEach((section) => {
      const labelEl = document.createElement("label");
      labelEl.className = "section-option";

      const inputEl = document.createElement("input");
      inputEl.type = "checkbox";
      inputEl.value = makeSectionKey(unit, section);
      inputEl.dataset.unit = unit;
      inputEl.dataset.section = section;
      inputEl.className = "section-checkbox";
      inputEl.addEventListener("change", () => updateUnitCheckboxState(groupEl));

      const textEl = document.createElement("span");
      textEl.textContent = section ? `Section ${section}` : "Section Not Listed";

      labelEl.append(inputEl, textEl);
      listEl.append(labelEl);
    });

    unitInputEl.addEventListener("change", () => {
      const sectionInputs = groupEl.querySelectorAll(".section-checkbox");

      sectionInputs.forEach((sectionInput) => {
        sectionInput.checked = unitInputEl.checked;
      });

      updateUnitCheckboxState(groupEl);
    });

    groupEl.append(listEl);
    updateUnitCheckboxState(groupEl);
    sectionGroupsEl.append(groupEl);
  });
}

function renderVocabularyIndexFilters(rows) {
  indexSectionGroupsEl.innerHTML = "";

  const groups = buildSectionGroups(rows);

  if (groups.size === 0) {
    indexSectionGroupsEl.append(createTextBlock("No sections were found in the vocabulary CSV."));
    return;
  }

  groups.forEach((sections, unit) => {
    const groupEl = document.createElement("fieldset");
    groupEl.className = "unit-group index-unit-group";

    const legendEl = document.createElement("legend");
    legendEl.className = "unit-title";

    const unitLabelEl = document.createElement("label");
    unitLabelEl.className = "unit-option";

    const unitInputEl = document.createElement("input");
    unitInputEl.type = "checkbox";
    unitInputEl.className = "unit-checkbox index-unit-checkbox";

    const unitTextEl = document.createElement("span");
    unitTextEl.textContent = unit ? `Unit ${unit}` : "Unit Not Listed";

    unitLabelEl.append(unitInputEl, unitTextEl);
    legendEl.append(unitLabelEl);
    groupEl.append(legendEl);

    const listEl = document.createElement("div");
    listEl.className = "checkbox-list";

    sections.forEach((section) => {
      const labelEl = document.createElement("label");
      labelEl.className = "section-option";

      const inputEl = document.createElement("input");
      inputEl.type = "checkbox";
      inputEl.value = makeSectionKey(unit, section);
      inputEl.dataset.unit = unit;
      inputEl.dataset.section = section;
      inputEl.className = "section-checkbox index-section-checkbox";
      inputEl.addEventListener("change", () => {
        updateUnitCheckboxState(groupEl);
        renderVocabularyIndexResults();
      });

      const textEl = document.createElement("span");
      textEl.textContent = section ? `Section ${section}` : "Section Not Listed";

      labelEl.append(inputEl, textEl);
      listEl.append(labelEl);
    });

    unitInputEl.addEventListener("change", () => {
      const sectionInputs = groupEl.querySelectorAll(".index-section-checkbox");

      sectionInputs.forEach((sectionInput) => {
        sectionInput.checked = unitInputEl.checked;
      });

      updateUnitCheckboxState(groupEl);
      renderVocabularyIndexResults();
    });

    groupEl.append(listEl);
    updateUnitCheckboxState(groupEl);
    indexSectionGroupsEl.append(groupEl);
  });
}

function renderFlashcardFilters(rows) {
  flashcardSectionGroupsEl.innerHTML = "";

  const groups = buildSectionGroups(rows);

  if (groups.size === 0) {
    flashcardSectionGroupsEl.append(createTextBlock("No sections were found in the vocabulary CSV."));
    return;
  }

  groups.forEach((sections, unit) => {
    const groupEl = document.createElement("fieldset");
    groupEl.className = "unit-group flashcard-unit-group";

    const legendEl = document.createElement("legend");
    legendEl.className = "unit-title";

    const unitLabelEl = document.createElement("label");
    unitLabelEl.className = "unit-option";

    const unitInputEl = document.createElement("input");
    unitInputEl.type = "checkbox";
    unitInputEl.className = "unit-checkbox flashcard-unit-checkbox";

    const unitTextEl = document.createElement("span");
    unitTextEl.textContent = unit ? `Unit ${unit}` : "Unit Not Listed";

    unitLabelEl.append(unitInputEl, unitTextEl);
    legendEl.append(unitLabelEl);
    groupEl.append(legendEl);

    const listEl = document.createElement("div");
    listEl.className = "checkbox-list";

    sections.forEach((section) => {
      const labelEl = document.createElement("label");
      labelEl.className = "section-option";

      const inputEl = document.createElement("input");
      inputEl.type = "checkbox";
      inputEl.value = makeSectionKey(unit, section);
      inputEl.dataset.unit = unit;
      inputEl.dataset.section = section;
      inputEl.className = "section-checkbox flashcard-section-checkbox";
      inputEl.addEventListener("change", () => {
        updateUnitCheckboxState(groupEl);
        rebuildFlashcardDeck();
      });

      const textEl = document.createElement("span");
      textEl.textContent = section ? `Section ${section}` : "Section Not Listed";

      labelEl.append(inputEl, textEl);
      listEl.append(labelEl);
    });

    unitInputEl.addEventListener("change", () => {
      const sectionInputs = groupEl.querySelectorAll(".flashcard-section-checkbox");

      sectionInputs.forEach((sectionInput) => {
        sectionInput.checked = unitInputEl.checked;
      });

      updateUnitCheckboxState(groupEl);
      rebuildFlashcardDeck();
    });

    groupEl.append(listEl);
    updateUnitCheckboxState(groupEl);
    flashcardSectionGroupsEl.append(groupEl);
  });
}

function updateUnitCheckboxState(groupEl) {
  const unitInput = groupEl.querySelector(".unit-checkbox");
  const sectionInputs = [...groupEl.querySelectorAll(".section-checkbox")];
  const checkedCount = sectionInputs.filter((input) => input.checked).length;
  const isChecked = sectionInputs.length > 0 && checkedCount === sectionInputs.length;
  const isIndeterminate = checkedCount > 0 && checkedCount < sectionInputs.length;

  unitInput.checked = isChecked;
  unitInput.indeterminate = isIndeterminate;
  unitInput.classList.toggle("is-indeterminate", isIndeterminate);
  unitInput.setAttribute("aria-checked", isIndeterminate ? "mixed" : String(isChecked));
}

function buildSectionGroups(rows) {
  const groups = new Map();

  rows.forEach((item) => {
    const unit = item.unit;
    const section = item.section;

    if (!groups.has(unit)) {
      groups.set(unit, new Set());
    }
    groups.get(unit).add(section);
  });

  return new Map(
    [...groups.entries()]
      .sort(([unitA], [unitB]) => compareLabels(unitA, unitB))
      .map(([unit, sections]) => [
        unit,
        [...sections].sort(compareLabels)
      ])
  );
}

function generateQuizlet() {
  const selectedKeys = getSelectedSectionKeys();

  if (selectedKeys.size === 0) {
    showMessage("Please select at least one section.");
    clearQuizlet();
    return;
  }

  const availableTerms = getUniqueTermsByConcept(getAvailableTermsForSections(selectedKeys));

  if (availableTerms.length === 0) {
    showMessage("No terms found for the selected sections.");
    clearQuizlet();
    return;
  }

  const requestedCount = Number(termCountEl.value);
  const selectedTerms = shuffleArray(availableTerms).slice(0, requestedCount);

  definitionsVisible = false;
  hasGenerated = true;
  currentTerms = selectedTerms;
  renderTerms();

  generateButton.textContent = "Regenerate Quizlet";
  revealButton.disabled = false;
  revealButton.textContent = "Reveal Definitions";

  if (availableTerms.length < requestedCount) {
    showMessage(
      `Only ${availableTerms.length} term${availableTerms.length === 1 ? "" : "s"} were available, so fewer terms are shown.`
    );
  } else {
    showMessage("");
  }
}

function renderTerms() {
  termsListEl.innerHTML = "";
  termsListEl.classList.remove("empty-state");

  currentTerms.forEach((item, index) => {
    const articleEl = document.createElement("article");
    articleEl.className = "term-card";

    const termRowEl = document.createElement("div");
    termRowEl.className = "term-row";

    const termEl = document.createElement("p");
    termEl.className = "term-word";
    termEl.textContent = item.concept;

    const regenerateTermButton = document.createElement("button");
    regenerateTermButton.type = "button";
    regenerateTermButton.className = "term-regenerate-button";
    regenerateTermButton.textContent = "Regenerate";
    regenerateTermButton.setAttribute("aria-label", `Regenerate ${item.concept}`);
    regenerateTermButton.addEventListener("click", () => regenerateSingleTerm(index));

    const definitionEl = document.createElement("p");
    definitionEl.className = "definition";
    definitionEl.hidden = !definitionsVisible;
    definitionEl.textContent = item.definition || "No definition provided.";

    termRowEl.append(termEl, regenerateTermButton);
    articleEl.append(termRowEl, definitionEl);
    termsListEl.append(articleEl);
  });
}

function renderVocabularyIndexResults() {
  if (vocabulary.length === 0) {
    indexResultsCountEl.textContent = "";
    indexResultsListEl.innerHTML = "";
    return;
  }

  const selectedKeys = getSelectedIndexSectionKeys();
  const searchTokens = getSearchTokens(vocabSearchEl.value);
  indexResultsListEl.innerHTML = "";

  if (selectedKeys.size === 0) {
    indexResultsCountEl.textContent = "Showing 0 terms.";
    indexResultsListEl.append(createIndexMessage("Select at least one unit or section to view terms."));
    return;
  }

  const matchingTerms = vocabulary.filter((item) => {
    const matchesSelectedSection = selectedKeys.has(makeSectionKey(item.unit, item.section));
    return matchesSelectedSection && itemMatchesSearch(item, searchTokens);
  });

  indexResultsCountEl.textContent = `Showing ${matchingTerms.length} term${matchingTerms.length === 1 ? "" : "s"}.`;

  if (matchingTerms.length === 0) {
    indexResultsListEl.append(createIndexMessage("No matching vocabulary terms found."));
    return;
  }

  matchingTerms.forEach((item) => {
    const articleEl = document.createElement("article");
    articleEl.className = "index-result-card";

    const conceptEl = document.createElement("h3");
    conceptEl.className = "index-concept";
    conceptEl.textContent = item.concept || "Concept not listed";

    const metaEl = document.createElement("p");
    metaEl.className = "index-meta";
    metaEl.textContent = `Unit ${item.unit || "Not Listed"} | Section ${item.section || "Not Listed"}`;

    const definitionEl = document.createElement("p");
    definitionEl.className = "index-definition";
    definitionEl.textContent = item.definition || "No definition provided.";

    articleEl.append(conceptEl, metaEl, definitionEl);
    indexResultsListEl.append(articleEl);
  });
}

function rebuildFlashcardDeck() {
  const selectedKeys = getSelectedFlashcardSectionKeys();

  flashcardDeck = [];
  currentFlashcardIndex = 0;
  flashcardShowingDefinition = false;

  if (selectedKeys.size === 0) {
    renderFlashcardEmptyState("Select at least one unit or section to practice.");
    return;
  }

  flashcardDeck = vocabulary.filter((item) => {
    return selectedKeys.has(makeSectionKey(item.unit, item.section)) && item.concept;
  });

  if (flashcardDeck.length === 0) {
    renderFlashcardEmptyState("No terms found for the selected sections.");
    return;
  }

  renderFlashcard();
}

function renderFlashcard() {
  const currentCard = flashcardDeck[currentFlashcardIndex];

  flashcardMessageEl.textContent = "";
  flashcardProgressEl.textContent = `Card ${currentFlashcardIndex + 1} of ${flashcardDeck.length}`;
  flashcardCardEl.classList.toggle("is-definition", flashcardShowingDefinition);
  flashcardSideLabelEl.textContent = flashcardShowingDefinition ? "Definition" : "Concept";
  flashcardTextEl.textContent = flashcardShowingDefinition
    ? currentCard.definition || "No definition provided."
    : currentCard.concept;
  setFlashcardControlsEnabled(true);
}

function renderFlashcardEmptyState(message) {
  flashcardMessageEl.textContent = message;
  flashcardProgressEl.textContent = "";
  flashcardCardEl.classList.remove("is-definition");
  flashcardSideLabelEl.textContent = "Concept";
  flashcardTextEl.textContent = message;
  setFlashcardControlsEnabled(false);
}

function flipFlashcard() {
  if (flashcardDeck.length === 0) {
    return;
  }

  flashcardShowingDefinition = !flashcardShowingDefinition;
  renderFlashcard();
}

function showPreviousFlashcard() {
  if (flashcardDeck.length === 0) {
    return;
  }

  currentFlashcardIndex = (currentFlashcardIndex - 1 + flashcardDeck.length) % flashcardDeck.length;
  flashcardShowingDefinition = false;
  renderFlashcard();
}

function showNextFlashcard() {
  if (flashcardDeck.length === 0) {
    return;
  }

  currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardDeck.length;
  flashcardShowingDefinition = false;
  renderFlashcard();
}

function shuffleFlashcardDeck() {
  if (flashcardDeck.length === 0) {
    return;
  }

  flashcardDeck = shuffleArray(flashcardDeck);
  currentFlashcardIndex = 0;
  flashcardShowingDefinition = false;
  renderFlashcard();
}

function setFlashcardControlsEnabled(isEnabled) {
  flashcardCardEl.disabled = !isEnabled;
  flipFlashcardButton.disabled = !isEnabled;
  previousFlashcardButton.disabled = !isEnabled;
  nextFlashcardButton.disabled = !isEnabled;
  shuffleFlashcardButton.disabled = !isEnabled;
}

function regenerateSingleTerm(termIndex) {
  const selectedKeys = getSelectedSectionKeys();
  const displayedConcepts = new Set(currentTerms.map((item) => item.concept));
  const replacementOptions = getUniqueTermsByConcept(getAvailableTermsForSections(selectedKeys)).filter((item) => {
    return !displayedConcepts.has(item.concept);
  });

  if (replacementOptions.length === 0) {
    showMessage("No unused replacement terms are available.");
    return;
  }

  currentTerms[termIndex] = shuffleArray(replacementOptions)[0];
  definitionsVisible = false;
  revealButton.textContent = "Reveal Definitions";
  showMessage("");
  renderTerms();
}

function toggleDefinitions() {
  if (!hasGenerated) {
    return;
  }

  definitionsVisible = !definitionsVisible;
  document.querySelectorAll(".definition").forEach((definitionEl) => {
    definitionEl.hidden = !definitionsVisible;
  });
  revealButton.textContent = definitionsVisible ? "Hide Definitions" : "Reveal Definitions";
}

function getSelectedSectionKeys() {
  const selectedInputs = document.querySelectorAll("#sectionGroups input[type='checkbox']:checked");
  return new Set([...selectedInputs].map((input) => input.value));
}

function getSelectedIndexSectionKeys() {
  const selectedInputs = document.querySelectorAll("#indexSectionGroups .index-section-checkbox:checked");
  return new Set([...selectedInputs].map((input) => input.value));
}

function getSelectedFlashcardSectionKeys() {
  const selectedInputs = document.querySelectorAll("#flashcardSectionGroups .flashcard-section-checkbox:checked");
  return new Set([...selectedInputs].map((input) => input.value));
}

function itemMatchesSearch(item, searchTokens) {
  if (searchTokens.length === 0) {
    return true;
  }

  const itemTokens = new Set(getSearchTokens(`${item.concept} ${item.definition}`));
  return searchTokens.every((token) => itemTokens.has(token));
}

function getSearchTokens(text) {
  return String(text).toLowerCase().match(/[a-z0-9]+/g) || [];
}

function getAvailableTermsForSections(selectedKeys) {
  return vocabulary.filter((item) => {
    return selectedKeys.has(makeSectionKey(item.unit, item.section)) && item.concept;
  });
}

function getUniqueTermsByConcept(terms) {
  const seenConcepts = new Set();

  return terms.filter((item) => {
    if (seenConcepts.has(item.concept)) {
      return false;
    }

    seenConcepts.add(item.concept);
    return true;
  });
}

function clearQuizlet() {
  definitionsVisible = false;
  hasGenerated = false;
  currentTerms = [];
  generateButton.textContent = "Generate Quizlet";
  revealButton.disabled = true;
  revealButton.textContent = "Reveal Definitions";
  termsListEl.innerHTML = "";
  termsListEl.classList.add("empty-state");
  termsListEl.append(createTextBlock("Select sections, choose a term count, and generate a classroom vocabulary check."));
}

function showMessage(message) {
  messageEl.textContent = message;
}

function createTextBlock(text) {
  const p = document.createElement("p");
  p.textContent = text;
  return p;
}

function createIndexMessage(text) {
  const p = createTextBlock(text);
  p.className = "index-empty-message";
  return p;
}

function makeSectionKey(unit, section) {
  return `${unit}\u001f${section}`;
}

function compareLabels(a, b) {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}
