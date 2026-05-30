# Head Case

Prose-first case transforms for Obsidian selections, starting with proper title case.

Head Case exists because code-oriented case tools are good at `snake_case` and `PascalCase`, but headings need prose judgment: small words, punctuation, acronyms, inline code, and Obsidian-flavored Markdown.

## Commands

- `Head Case: Title Case`
- `Head Case: Sentence case`
- `Head Case: lower case`
- `Head Case: UPPER CASE`
- `Head Case: Select case transform`

## Development

```bash
pnpm install
pnpm test
pnpm build
```

## Design

- Keep title-casing logic pure and tested in `src/title-case.ts`.
- Keep Obsidian editor integration thin in `src/main.ts`.
- Preserve inline code spans.
- Preserve wikilink targets while title-casing aliases.
- Support multiple selections in one editor transaction.

