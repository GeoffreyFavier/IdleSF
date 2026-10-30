import { CARDS } from '../data/cards';
import { GRID_SIZE } from '../data/constants';
import type { GameState } from '../engine/types';

const SAVE_KEY = 'forge-orbitale-save';
const DEBUG_KEY = 'forge-orbitale-debug';
const SAVE_VERSION = 1;

function isValidState(s: unknown): s is GameState {
  if (typeof s !== 'object' || s === null) return false;
  const g = s as GameState;
  const known = (id: unknown) => typeof id === 'string' && id in CARDS;
  return (
    ['planning', 'reward', 'gameover'].includes(g.phase) &&
    Array.isArray(g.grid) &&
    g.grid.length === GRID_SIZE * GRID_SIZE &&
    g.grid.every((c) => c === null || known(c?.defId)) &&
    [g.hand, g.drawPile, g.discardPile, g.rewardOptions].every((a) => Array.isArray(a) && a.every(known)) &&
    typeof g.rngState === 'number'
  );
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; state?: unknown };
    return parsed.version === SAVE_VERSION && isValidState(parsed.state) ? parsed.state : null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state }));
  } catch {
    /* storage unavailable: the game still works, just without autosave */
  }
}

export function loadDebug(): boolean {
  try {
    return localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveDebug(on: boolean): void {
  try {
    localStorage.setItem(DEBUG_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}
