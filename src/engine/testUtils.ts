import { createCard, newGame } from './game';
import type { Dir, GameState, Resources } from './types';

export interface Placement {
  cell: number;
  defId: string;
  dir: Dir;
  inbox?: Partial<Resources>;
  outbox?: Partial<Resources>;
}

/** Fresh game with the given cards placed directly on the grid (bypasses hand rules). */
export function boardWith(placements: Placement[], seed = 1): GameState {
  const state = newGame(seed);
  for (const p of placements) {
    const card = createCard(state, p.defId, p.dir);
    Object.assign(card.inbox, p.inbox);
    Object.assign(card.outbox, p.outbox);
    state.grid[p.cell] = card;
  }
  return state;
}

export const N = 0, E = 1, S = 2, W = 3;
/** Cells orthogonally adjacent to the Terminal (index 12). */
export const ABOVE = 7, LEFT = 11, RIGHT = 13, BELOW = 17;
