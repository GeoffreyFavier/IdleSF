import { RESOURCE_VALUES, TERMINAL_INDEX } from '../data/constants';
import { RESOURCE_ORDER } from '../data/resources';
import { getDef, inboxRoom, outboxCapacity, outboxRoom, sendThroughput } from './cards';
import { neighborIndex, orthogonalNeighbors, resourceTotal, rotateDir } from './grid';
import type { CardInstance, GameState, ResourceId, Resources } from './types';

/** Production bonus a source at `index` gets from adjacent passive cards. */
function sourceBonus(state: GameState, index: number): number {
  let bonus = 0;
  for (const n of orthogonalNeighbors(index)) {
    const card = state.grid[n];
    if (!card) continue;
    const b = getDef(card.defId).behavior;
    if (b.type !== 'passive') continue;
    for (const e of b.effects) if (e.kind === 'adjacentSourceBonus') bonus += e.amount;
  }
  return bonus;
}

interface SaleModifiers {
  flatBonus: number;
  multiplier: Partial<Record<ResourceId, number>>;
}

function saleModifiers(state: GameState): SaleModifiers {
  const mods: SaleModifiers = { flatBonus: 0, multiplier: {} };
  const nearTerminal = new Set(orthogonalNeighbors(TERMINAL_INDEX));
  state.grid.forEach((card, index) => {
    if (!card) return;
    const b = getDef(card.defId).behavior;
    if (b.type !== 'passive') return;
    for (const e of b.effects) {
      if (e.kind === 'terminalAdjacentSaleBonus' && nearTerminal.has(index)) {
        mods.flatBonus += e.amount;
      } else if (e.kind === 'saleMultiplier') {
        mods.multiplier[e.resource] = (mods.multiplier[e.resource] ?? 1) * e.factor;
      }
    }
  });
  return mods;
}

function sell(inbox: Resources, mods: SaleModifiers): number {
  let credits = 0;
  for (const res of RESOURCE_ORDER) {
    const n = inbox[res];
    if (n <= 0) continue;
    credits += n * (RESOURCE_VALUES[res] * (mods.multiplier[res] ?? 1) + mods.flatBonus);
    inbox[res] = 0;
  }
  return credits;
}

function production(state: GameState): void {
  state.grid.forEach((card, index) => {
    if (!card) return;
    const def = getDef(card.defId);
    if (def.behavior.type !== 'source') return;
    const amount = def.behavior.amount + sourceBonus(state, index);
    card.outbox[def.behavior.resource] += Math.min(amount, outboxRoom(card, def));
  });
}

function conversionAndSales(state: GameState): number {
  const mods = saleModifiers(state);
  let credits = 0;
  for (const card of state.grid) {
    if (!card) continue;
    const def = getDef(card.defId);
    const b = def.behavior;
    if (b.type === 'converter') {
      const inputs = Object.entries(b.inputs) as [ResourceId, number][];
      const outputs = Object.entries(b.outputs) as [ResourceId, number][];
      const outTotal = outputs.reduce((sum, [, n]) => sum + n, 0);
      if (inputs.every(([res, n]) => card.inbox[res] >= n) && outboxRoom(card, def) >= outTotal) {
        for (const [res, n] of inputs) card.inbox[res] -= n;
        for (const [res, n] of outputs) card.outbox[res] += n;
      }
    } else if (b.type === 'logistics') {
      const multiplier = b.multiplier ?? 1;
      let budget = b.rate;
      for (const res of RESOURCE_ORDER) {
        while (card.inbox[res] > 0 && budget > 0 && outboxRoom(card, def) >= multiplier) {
          card.inbox[res] -= 1;
          card.outbox[res] += multiplier;
          budget -= 1;
        }
      }
    } else if (b.type === 'terminal') {
      credits += sell(card.inbox, mods);
    }
  }
  return credits;
}

/** Target cells for a card, in preference order, with the splitter option each one stands for. */
function targetsFor(card: CardInstance, index: number): { cell: number; option: 0 | 1 }[] {
  const b = getDef(card.defId).behavior;
  if (b.type === 'passive' || b.type === 'terminal') return [];
  const range = b.type === 'logistics' ? (b.range ?? 1) : 1;
  const split = b.type === 'logistics' && b.split === true;
  const targets: { cell: number; option: 0 | 1 }[] = [];
  const primary = neighborIndex(index, card.dir, range);
  if (primary !== null) targets.push({ cell: primary, option: 0 });
  if (split) {
    const secondary = neighborIndex(index, rotateDir(card.dir), range);
    if (secondary !== null) targets.push({ cell: secondary, option: 1 });
    if (card.splitToggle === 1) targets.reverse();
  }
  return targets;
}

function transfer(state: GameState): void {
  // Sending only drains a card's own outbox and only fills inboxes, so a unit that
  // arrives this tick can never be forwarded again within the same tick.
  const snapshot = state.grid.map((c) => (c ? { ...c.outbox } : null));
  const sent = state.grid.map(() => 0);

  state.grid.forEach((card, index) => {
    const snap = snapshot[index];
    if (!card || !snap) return;
    const def = getDef(card.defId);
    if (outboxCapacity(def) === 0) return;
    let budget = sendThroughput(def);
    for (const res of RESOURCE_ORDER) {
      let available = snap[res];
      while (available > 0 && budget > 0) {
        // Recomputed per unit: a splitter flips its preference after each send.
        const targets = targetsFor(card, index);
        const hit = targets.find((t) => {
          const target = state.grid[t.cell];
          return target !== null && target !== undefined && inboxRoom(target, getDef(target.defId), res) > 0;
        });
        if (!hit) break;
        const target = state.grid[hit.cell] as CardInstance;
        card.outbox[res] -= 1;
        target.inbox[res] += 1;
        if (targets.length > 1) card.splitToggle = hit.option === 0 ? 1 : 0;
        available -= 1;
        budget -= 1;
        sent[index] = (sent[index] ?? 0) + 1;
      }
    }
  });

  state.grid.forEach((card, index) => {
    if (!card) return;
    const cap = outboxCapacity(getDef(card.defId));
    card.blocked = cap > 0 && resourceTotal(card.outbox) >= cap && (sent[index] ?? 0) === 0;
  });
}

function tickInPlace(state: GameState): void {
  production(state);
  const credits = conversionAndSales(state);
  transfer(state);
  state.lastTickCredits = credits;
  state.contractCredits += credits;
  state.stats.totalCredits += credits;
  state.stats.ticks += 1;
}

/** Simulates one tick. Pure: returns a new state. */
export function simulateTick(state: GameState): GameState {
  const next = structuredClone(state);
  tickInPlace(next);
  return next;
}

/** Simulates `ticks` ticks. Pure: returns a new state. */
export function runTurn(state: GameState, ticks: number): GameState {
  const next = structuredClone(state);
  for (let i = 0; i < ticks; i++) tickInPlace(next);
  return next;
}
