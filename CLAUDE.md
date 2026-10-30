# CLAUDE.md — Forge Orbitale (prototype)

Mobile web "engine builder" prototype. Game rules: `docs/GDD.md`. Open questions / rule
choices: `docs/QUESTIONS.md`. UI text is **French**; code, identifiers and comments are **English**.

## Stack
Vite + TypeScript (strict) + Preact, plain CSS with variables, Vitest. No other dependencies
without asking the user first. Vite `base` is `/IdleSF/` (override with `VITE_BASE`).

## Commands
- `npm run dev` — dev server (http://localhost:5173/IdleSF/)
- `npm test` — Vitest (engine tests)
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — typecheck + production build into `dist/`

## Structure
- `src/engine/` — PURE deterministic simulation. No DOM, no Preact. State is plain JSON
  (serializable); the seeded RNG state (mulberry32) lives in the game state.
  Public API: `newGame`, `placeCard`, `rotateCard`, `simulateTick`, `runTurn`, `endTurn`,
  `launchTurn`, `chooseRewardCard`, `removeCardFromDeck`, ...
- `src/data/` — card catalog and ALL balance constants (quotas, ticks, capacities, values).
  Never hardcode a gameplay number in the engine.
- `src/ui/` — Preact components; they read state and call the engine. Local UI state
  (selection, running animation, debug) is not part of the engine state.
- Cards are data + a few generic behaviors: `source`, `converter`, `logistics`, `passive`,
  `terminal`. Add cards in `src/data/cards.ts` without touching the engine whenever possible.

## Conventions
- Engine functions never mutate their input: they clone, then mutate the clone.
- Every engine rule needs a Vitest test (`src/engine/*.test.ts`).
- Tick order: production → conversion/logistics/sale → transfer (from an outbox snapshot,
  cells processed in index order).
- Commit per step with clear messages. Ambiguous rule? Pick the simplest option, log it in
  `docs/QUESTIONS.md`, move on.
