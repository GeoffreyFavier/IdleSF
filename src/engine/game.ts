import {
  GRID_SIZE,
  HAND_SIZE,
  MAX_PLACEMENTS_PER_TURN,
  QUOTAS,
  QUOTA_GROWTH_FACTOR,
  RARITY_WEIGHTS,
  REWARD_CHOICES,
  STARTING_DECK,
  TERMINAL_INDEX,
  TICKS_PER_TURN,
  TURNS_PER_CONTRACT,
} from '../data/constants';
import { CARD_LIST, TERMINAL_ID } from '../data/cards';
import { getDef } from './cards';
import { dirToward, emptyResources, rotateDir } from './grid';
import { nextRandom, shuffleInPlace } from './rng';
import { runTurn } from './tick';
import type { CardInstance, Dir, GameState, Rarity, Tag } from './types';

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare'];

/** Creates a card instance and consumes a uid from the state. */
export function createCard(state: { nextUid: number }, defId: string, dir: Dir): CardInstance {
  return {
    uid: state.nextUid++,
    defId,
    dir,
    inbox: emptyResources(),
    outbox: emptyResources(),
    splitToggle: 0,
    blocked: false,
  };
}

export function getQuota(contractIndex: number): number {
  const last = QUOTAS.length - 1;
  if (contractIndex <= last) return QUOTAS[contractIndex] as number;
  return (QUOTAS[last] as number) * QUOTA_GROWTH_FACTOR ** (contractIndex - last);
}

function drawHand(state: GameState): void {
  while (state.hand.length < HAND_SIZE) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) return;
      state.drawPile = shuffleInPlace(state, state.discardPile);
      state.discardPile = [];
    }
    state.hand.push(state.drawPile.pop() as string);
  }
}

export function newGame(seed: number, startingDeck: Record<string, number> = STARTING_DECK): GameState {
  const state: GameState = {
    seed,
    rngState: seed >>> 0,
    phase: 'planning',
    contractIndex: 0,
    turnIndex: 0,
    contractCredits: 0,
    grid: Array.from({ length: GRID_SIZE * GRID_SIZE }, () => null),
    drawPile: [],
    discardPile: [],
    hand: [],
    placedThisTurn: 0,
    rewardOptions: [],
    nextUid: 1,
    lastTickCredits: 0,
    stats: { totalCredits: 0, contractsCompleted: 0, cardsPlaced: 0, ticks: 0 },
  };
  state.grid[TERMINAL_INDEX] = createCard(state, TERMINAL_ID, 0);
  for (const [id, count] of Object.entries(startingDeck)) {
    for (let i = 0; i < count; i++) state.drawPile.push(id);
  }
  shuffleInPlace(state, state.drawPile);
  drawHand(state);
  return state;
}

/** Default output direction: toward the Terminal when adjacent, else North. */
export function defaultDirection(cell: number): Dir {
  return dirToward(cell, TERMINAL_INDEX) ?? 0;
}

export function placementsLeft(state: GameState): number {
  return Math.max(0, MAX_PLACEMENTS_PER_TURN - state.placedThisTurn);
}

export function canPlace(state: GameState, handIndex: number, cell: number): boolean {
  return (
    state.phase === 'planning' &&
    handIndex >= 0 &&
    handIndex < state.hand.length &&
    cell >= 0 &&
    cell < state.grid.length &&
    cell !== TERMINAL_INDEX &&
    placementsLeft(state) > 0
  );
}

/** Places a hand card on a cell (replacing any card there). Returns the state unchanged if invalid. */
export function placeCard(state: GameState, handIndex: number, cell: number, dir?: Dir): GameState {
  if (!canPlace(state, handIndex, cell)) return state;
  const next = structuredClone(state);
  const [defId] = next.hand.splice(handIndex, 1) as [string];
  const previous = next.grid[cell];
  if (previous) next.discardPile.push(previous.defId);
  next.grid[cell] = createCard(next, defId, dir ?? defaultDirection(cell));
  next.placedThisTurn += 1;
  next.stats.cardsPlaced += 1;
  return next;
}

export function rotateCard(state: GameState, cell: number): GameState {
  const card = state.grid[cell];
  if (state.phase !== 'planning' || !card || cell === TERMINAL_INDEX) return state;
  const next = structuredClone(state);
  const target = next.grid[cell] as CardInstance;
  target.dir = rotateDir(target.dir);
  return next;
}

function pickReward(state: GameState): string[] {
  const options: string[] = [];
  let attempts = 0;
  while (options.length < REWARD_CHOICES && attempts++ < 200) {
    const total = RARITY_ORDER.reduce((sum, r) => sum + RARITY_WEIGHTS[r], 0);
    let roll = nextRandom(state) * total;
    let rarity: Rarity = 'common';
    for (const r of RARITY_ORDER) {
      if (roll < RARITY_WEIGHTS[r]) {
        rarity = r;
        break;
      }
      roll -= RARITY_WEIGHTS[r];
    }
    const pool = CARD_LIST.filter((c) => c.rarity === rarity && !options.includes(c.id));
    if (pool.length === 0) continue;
    options.push((pool[Math.floor(nextRandom(state) * pool.length)] as { id: string }).id);
  }
  return options;
}

/** Ends the planning turn: discards the hand, then either draws the next hand or resolves the contract. */
export function endTurn(state: GameState): GameState {
  if (state.phase !== 'planning') return state;
  const next = structuredClone(state);
  next.discardPile.push(...next.hand);
  next.hand = [];
  next.placedThisTurn = 0;
  next.turnIndex += 1;
  if (next.turnIndex >= TURNS_PER_CONTRACT) {
    if (next.contractCredits >= getQuota(next.contractIndex)) {
      next.phase = 'reward';
      next.stats.contractsCompleted += 1;
      next.rewardOptions = pickReward(next);
    } else {
      next.phase = 'gameover';
    }
  } else {
    drawHand(next);
  }
  return next;
}

/** Runs a full turn (all ticks) then ends it. */
export function launchTurn(state: GameState): GameState {
  return endTurn(runTurn(state, TICKS_PER_TURN));
}

function startNextContract(state: GameState): void {
  state.phase = 'planning';
  state.contractIndex += 1;
  state.turnIndex = 0;
  state.contractCredits = 0;
  state.placedThisTurn = 0;
  state.rewardOptions = [];
  drawHand(state);
}

export function chooseRewardCard(state: GameState, defId: string): GameState {
  if (state.phase !== 'reward' || !state.rewardOptions.includes(defId)) return state;
  const next = structuredClone(state);
  next.discardPile.push(defId);
  startNextContract(next);
  return next;
}

/** Cards that can be removed at the reward screen (draw + discard piles), counted by id. */
export function removableCards(state: GameState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of [...state.drawPile, ...state.discardPile]) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

export function removeCardFromDeck(state: GameState, defId: string): GameState {
  if (state.phase !== 'reward' || !(defId in removableCards(state))) return state;
  const next = structuredClone(state);
  const pile = next.discardPile.includes(defId) ? next.discardPile : next.drawPile;
  pile.splice(pile.indexOf(defId), 1);
  startNextContract(next);
  return next;
}

/** Number of placed cards per tag (hook for future set bonuses). */
export function tagCounts(state: GameState): Partial<Record<Tag, number>> {
  const counts: Partial<Record<Tag, number>> = {};
  state.grid.forEach((card, index) => {
    if (!card || index === TERMINAL_INDEX) return;
    for (const tag of getDef(card.defId).tags) counts[tag] = (counts[tag] ?? 0) + 1;
  });
  return counts;
}
