# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit-based Japanese language learning application featuring vocabulary practice, kanji learning, grammar exercises, and an Anki-like flashcard system with SM-2 spaced repetition. The app is statically generated and deployed to GitHub Pages at `/study-japanese`. Supports multiple JLPT levels (N5, N4, with infrastructure for N1-N3).

## Development Commands

### Core Development

- `pnpm dev` - Start development server
- `pnpm build` - Build static site (adapter-static with base path `/study-japanese` in production)
- `pnpm preview` - Preview production build locally

### Code Quality

- `pnpm check` - Type check with svelte-check
- `pnpm check:watch` - Type check in watch mode
- `pnpm lint` - Run prettier check and eslint
- `pnpm format` - Format code with prettier

### Testing

- `pnpm test:unit` - Run vitest unit tests
- `pnpm test:e2e` - Run playwright e2e tests
- `pnpm test` - Run all tests (unit + e2e)

### Data Generation

- `pnpm gen-kanji` - Fetch kanji definitions from Jotoba API and generate `*_def.json` files in `src/lib/kanji/`

## Architecture

### Route Structure

The app uses SvelteKit's file-based routing with prerendering for static deployment:

- `/` - Dashboard homepage with stats, feature cards, and unit navigation
- `/vocab/[level]/[unit]` - Vocabulary reference by level and unit (e.g., `/vocab/n5/u1`, `/vocab/n4/all`)
- `/practice/[level]/[unit]` - Vocabulary practice (MCQ) by level and unit
- `/practice/kanji/[level]` - Combined kanji practice (randomly mixes Sino-Vietnamese MCQ and handwriting)
- `/practice/kanji/[level]/mcq` - Dedicated Sino-Vietnamese reading (Âm Hán Việt) MCQ only
- `/practice/kanji/[level]/draw` - Dedicated kanji handwriting recognition only
- `/practice/verb` - Verb conjugation practice
- `/grammar/verb` - Verb grammar explanations
- `/flashcard` - Flashcard dashboard with deck list and due count
- `/flashcard/deck/new` - Create new flashcard deck
- `/flashcard/deck/[id]` - Deck detail view with card management
- `/flashcard/deck/[id]/review` - Review session with SM-2 rating
- `/flashcard/deck/[id]/stats` - Deck statistics and analytics
- `/flashcard/import` - Import decks from JSON

**Supported levels:** n1, n2, n3, n4, n5 (routes are auto-generated for levels with data)

**Prerendered vs Client-only routes:**

- Vocabulary and vocab practice routes are pre-rendered at build time (discovered from filesystem in `svelte.config.js`)
- Kanji practice routes (`/practice/kanji/[level]`, `/practice/kanji/[level]/draw`) use `ssr = false` and are client-only (use canvas and fetch API for handwriting recognition)
- Flashcard routes use `ssr = false` and are client-only (depend on IndexedDB)

### Data Organization

**Vocabulary Data** (`src/lib/n5/`, `src/lib/n4/`, etc.)

- Unit files: `u1.json`, `u2.json`, etc.
- Each file contains an array of `WordDefinition` objects:
  ```typescript
  {
    word: string      // Japanese word (kanji, hiragana, or katakana)
    reading?: string  // Hiragana reading (optional if word is already kana)
    meaning: string   // Vietnamese meaning
    note?: string     // Optional note
    _unit?: string    // Internal: source unit (auto-populated when loading "all" or range views)
  }
  ```

**Kanji Data** (`src/lib/kanji/`)

- Level files: `n5.json` (contains array of kanji characters)
- Generated definition files: `n5_def.json` (maps kanji to definitions)
- Kanji definitions fetched from Jotoba API via `pnpm gen-kanji`

**Flashcard Module** (`src/lib/flashcard/`)

- `types.ts` - Core types: `Flashcard`, `Deck`, `ReviewLog`, `DailyStats`, `SM2State`, `Rating`
- `db.ts` - IndexedDB schema and connection via `idb` library
- `sm2.ts` - SM-2 spaced repetition algorithm (Anki-style 4-button rating)
- `storage.ts` - CRUD operations for decks, cards, reviews, stats; includes `getAllCards()` for cross-deck queries
- `session.ts` - Review session queue management
- `stats.ts` - Statistics calculations (retention, streak, forecast)
- `io.ts` - Import/export JSON functionality
- `vocab-convert.ts` - Convert WordDefinition/Kanji to Flashcard
- `index.ts` - Module re-exports

**Handwriting Module** (`src/lib/handwriting/`)

- `types.ts` - `Stroke`, `RecognitionResult` types
- `google.ts` - Google handwriting recognition API integration
- `index.ts` - Module re-exports

**Unit Import System** (`src/lib/unit_import.ts`)

- Handles flexible unit loading: single units (`u1`), ranges (`u3-u8`), or all units (`all`)
- Accepts `level` parameter to load from different JLPT levels
- Uses Vite's `import.meta.glob` with pre-defined globs for each level (n1-n5)
- Returns `{ unit: string, json: Dictionary }` structure
- When loading "all" or range views, augments each word with `_unit` field tracking its source unit

### Key Components

Located in `src/lib/components/`:

- `mcq.svelte` - Multiple choice question component for vocabulary practice
- `kanji-mcq.svelte` - MCQ component for Sino-Vietnamese reading (Âm Hán Việt) practice
- `kanji-canvas.svelte` - Canvas for handwriting kanji with stroke capture, undo/clear, theme support
- `vocab.svelte` - Vocabulary table with search functionality (supports kanji, hiragana, romaji, Vietnamese); includes "+" button to add words to flashcard decks and "-" button to remove (with duplicate detection - words already in a deck show "-" with tooltip indicating deck name)
- `answer.svelte` - Answer reveal/check component
- `furigana.svelte` - Furigana display wrapper
- `theme-switcher.svelte` - DaisyUI theme switcher (retro/dim themes)

**Flashcard Components** (`src/lib/components/flashcard/`):

- `flashcard-card.svelte` - 3D flip card with CSS animation
- `rating-buttons.svelte` - SM-2 rating buttons (Again/Hard/Good/Easy) with interval preview
- `deck-card.svelte` - Deck preview card with stats and dropdown menu
- `deck-form.svelte` - Create/edit deck form
- `card-form.svelte` - Create/edit flashcard form
- `add-to-deck-modal.svelte` - Modal for adding vocab words to decks (used in vocab.svelte)
- `stats-overview.svelte` - Statistics display widget (retention, streak, card breakdown)

### Type Definitions

- `src/lib/types/vocab.ts` - `WordDefinition`, `Dictionary` types
- `src/lib/types/kanji.ts` - `KanjiDefinition`, `Kanji`, `KanjiJotoba` types
- `src/lib/flashcard/types.ts` - Flashcard types: `Flashcard`, `Deck`, `DeckSettings`, `SM2State`, `Rating`, `CardStatus`, `CardSource`, `ReviewLog`, `DailyStats`, `DeckStats`, `ExportData`

### Styling

- Tailwind CSS with DaisyUI v4 components
- `@tailwindcss/typography` for prose content
- `theme-change` library for theme switching
- Themes: `retro` (light), `dim` (dark)
- Theme persistence via localStorage (initialized in `app.html` before hydration)
- Custom global styles in `src/app.css`

### Third-Party Libraries

- `wanakana` - Japanese romanization utilities (used in vocab search for romaji-to-kana conversion)
- `furigana` - Japanese furigana parsing
- `theme-change` - Theme switching for DaisyUI
- `idb` - IndexedDB wrapper for flashcard data persistence (~1.2KB)

## Important Configuration Details

**Base Path in Production**: The app uses `/study-japanese` as base path in production (configured in `svelte.config.js`). All asset paths and navigation must account for this.

**Prerendering**: Routes are dynamically discovered from the filesystem in `svelte.config.js`. When adding new units or levels, they are automatically included if the data directory exists.

**SPA Fallback**: The adapter-static is configured with `fallback: '200.html'` to handle client-only flashcard routes that can't be prerendered.

**Theme Initialization**: Theme is set from localStorage via inline script in `app.html` before SvelteKit hydration to prevent flash of wrong theme.

**MDSvex Support**: `.svx` files are supported for markdown content in Svelte components (configured in `svelte.config.js`).

**Flashcard Storage**: Flashcard data is stored in IndexedDB (database name: `study-japanese-flashcards`). All flashcard routes use `ssr = false` since IndexedDB is client-only.

## Common Workflows

### Adding New Vocabulary Units

1. Create `src/lib/[level]/uN.json` with vocabulary data (e.g., `src/lib/n4/u50.json`)
2. Build will automatically discover and prerender the new routes
3. No code changes needed - dynamic discovery handles it

### Adding New JLPT Levels

1. Create directory `src/lib/[level]/` (e.g., `src/lib/n3/`)
2. Add unit JSON files with vocabulary data
3. The `unit_import.ts` already has globs for n1-n5
4. Routes will be auto-generated on next build

### Adding New Kanji Levels

1. Create `src/lib/kanji/LEVEL.json` with kanji character array
2. Run `pnpm gen-kanji` to fetch definitions
3. Build will automatically discover and prerender the new routes

### Modifying Practice/Vocab Routes

Routes use `[level]` and `[unit]` dynamic parameters:

- `+page.ts` - Loads data via `importUnit(unit, level)`
- `+page.svelte` - Renders UI with loaded data

### Vocab Search Feature

The vocab component (`src/lib/components/vocab.svelte`) supports searching:

- Direct kanji/kana match
- Hiragana/Katakana reading match
- Vietnamese meaning (case-insensitive)
- Romaji input (converted to kana via wanakana)

Example: Searching "gakkou" will find entries with reading "がっこう"

### Flashcard System

**SM-2 Algorithm**: The flashcard system uses the SM-2 spaced repetition algorithm (same as Anki). Rating options:

- Again (1): Complete failure, resets interval
- Hard (2): Correct but difficult
- Good (3): Correct with effort (default)
- Easy (4): Effortless recall

**Card Sources**: Cards can be created from:

- Vocabulary words (via "+" button in vocab table)
- Kanji data
- Custom input
- JSON import

**Word Identity**: A word is uniquely identified by `level|unit|word` composite key. The same word from different units is treated as different. Words can only belong to one deck at a time.

**Default Direction**: Vietnamese → Japanese (configurable per deck). This means the front shows Vietnamese meaning and the back shows the Japanese word.

### Adding Flashcard Features

When modifying flashcard functionality:

1. **Data layer changes**: Update `src/lib/flashcard/types.ts` for new types, then update relevant modules (storage.ts, sm2.ts, etc.)
2. **UI components**: Add to `src/lib/components/flashcard/`
3. **New routes**: Create in `src/routes/flashcard/` with `export const ssr = false`
4. **Re-exports**: Update `src/lib/flashcard/index.ts` to export new functions/types

### Flashcard Import/Export

Export format is JSON with structure:

```json
{
  "version": "1.0.0",
  "exportedAt": 1700000000000,
  "deck": { "name": "...", "settings": {...} },
  "cards": [...],
  "reviews": [...] // optional
}
```

Import supports duplicate handling options: skip, replace, or keep both.
