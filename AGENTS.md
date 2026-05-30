# AGENTS.md - Head Case

Head Case is an Obsidian plugin for prose-first case transforms, especially proper title case for headings and selected text.

## Project Principles

- Keep prose transformation logic pure, deterministic, and well tested.
- Keep Obsidian integration thin and isolated to plugin lifecycle/editor code.
- Preserve Obsidian-flavored Markdown wherever possible, especially wikilinks and inline code.
- Favor small, composable functions over large command handlers.
- Mobile compatibility matters; avoid desktop-only APIs unless clearly guarded.

## Build and Test

```bash
pnpm install
pnpm test
pnpm build
```

## Functional Programming & Ramda Guidance

This project prefers pure, composable functions for business logic where possible, while using classes for Obsidian's lifecycle/view APIs.

### Core Principles

1. **Pure Functions**: No side effects except at system boundaries (Obsidian API calls, file I/O, DOM manipulation)
2. **Immutability**: Prefer spreading objects (`{ ...obj, newProp }`) over mutation
3. **Composition**: Build complex operations from simple, testable functions
4. **Named Imports**: Always use named imports, never `import * as R`
5. **Data-Last Pattern**: Custom utility functions should follow Ramda conventions (data comes last for currying)

### Import Style

**ALWAYS: Named imports**
```typescript
import { pipe, map, filter, prop, sortBy } from 'ramda';
```

**NEVER: Namespace imports**
```typescript
import * as R from 'ramda'; // Reduces readability, hurts tree-shaking
```

### Ramda Usage Patterns

#### Data Access

```typescript
import { prop, path, pathOr, pluck } from 'ramda';

// Get property
const getTitle = prop('title');
const titles = verses.map(getTitle);

// Get nested property with default
const getDate = pathOr(null, ['metadata', 'date']);

// Extract from array of objects
const getNumbers = pluck('number');
const numbers = getNumbers(sermons);
```

#### Data Transformation

```typescript
import { pipe, map, filter, groupBy } from 'ramda';

// Transform collection
const processTranslations = pipe(
  filter(t => t.isValid),           // Remove invalid
  map(normalizeTranslation),        // Transform each
  groupBy(prop('testament'))        // Group by testament
);

const processed = processTranslations(translations);
```

#### Predicates and Logic

```typescript
import { propEq, test, allPass, anyPass, complement } from 'ramda';

// Simple predicates
const isESV = propEq('name', 'ESV');
const hasVerseNumbers = test(/\d+:\d+/);

// Composed predicates
const isValidTranslation = allPass([
  prop('filePath'),
  prop('name'),
  t => t.name.length > 0
]);

// Negation
const isNotNil = complement(isNil);
```

#### String Manipulation

```typescript
import { pipe, trim, replace, split, join, toUpper } from 'ramda';

// Text cleaning
const cleanReference = pipe(
  trim,
  replace(/\s+/g, ' '),
  replace(/[,;]+$/, '')
);

// Book code normalization
const normalizeBookCode = pipe(
  trim,
  toUpper,
  replace(/\s+/g, '_')
);
```

### Practical Functional Patterns for Obsidian Plugins

#### Pure Business Logic

Keep logic functions pure and extract them from class methods:

```typescript
// Pure helper - easy to test
const buildCalloutHeader = (reference: string, translation: string): string => {
  return `> [!scripture]+ [[${translation} ${reference}]]`;
};

// Class method handles side effects
class CalloutFormatter {
  insertScriptureCallout(editor: Editor, reference: string, verses: BibleVerse[]): void {
    const header = buildCalloutHeader(reference, this.settings.defaultTranslation);
    const body = this.formatVerses(verses); // Also pure
    const callout = `${header}\n${body}`;

    // Side effect isolated here
    editor.replaceSelection(callout);
  }
}
```

#### Verse Formatting Pipeline

```typescript
import { pipe, map, join } from 'ramda';

// Pure transformation pipeline
const formatVerses = (includeNumbers: boolean) => pipe(
  map((verse: BibleVerse) => formatSingleVerse(verse, includeNumbers)),
  join('\n')
);

// Usage
const formattedText = formatVerses(true)(verses);
```

#### Settings Transformation

```typescript
import { pipe, filter, map, sortBy, prop } from 'ramda';

// Get available translations with notes
const getNotesTranslations = pipe(
  filter((t: BibleTranslation) => t.availableAsNotes && t.notesDirectory),
  sortBy(prop('name'))
);

const notesTranslations = getNotesTranslations(this.settings.translations);
```

#### Conditional Logic

```typescript
import { cond, equals, always, T } from 'ramda';

// Pattern matching for display mode
const getVerseNumberDisplay = cond([
  [equals('all'), always(true)],
  [equals('first'), always('first-only')],
  [equals('none'), always(false)],
  [T, always(true)] // Default
]);

const displayMode = getVerseNumberDisplay(settings.verseNumberDisplayMode);
```

### Balancing OOP and FP

**Use Classes For**:
- Obsidian API integration (Plugin, Modal, PluginSettingTab)
- Component lifecycle management
- Stateful UI components
- Side effect coordination

**Use Pure Functions For**:
- Data transformation
- Formatting logic
- Validation
- Parsing
- Filtering and sorting

**Example Structure**:

```typescript
// Pure utilities (top of file or separate module)
const parseReference = (text: string): ParsedReference | null => { /* ... */ };
const formatCallout = (ref: ParsedReference, verses: BibleVerse[]): string => { /* ... */ };

// Class for Obsidian integration
export class ScriptureModal extends Modal {
  // State managed by class
  private selectedTranslation: string;

  // Side effects in methods
  async handleSubmit(): Promise<void> {
    const reference = this.inputEl.value;

    // Call pure functions
    const parsed = parseReference(reference);
    if (!parsed) return;

    const verses = await this.lookupVerses(parsed);
    const callout = formatCallout(parsed, verses);

    // Side effect
    this.onSubmit(callout);
    this.close();
  }
}
```

