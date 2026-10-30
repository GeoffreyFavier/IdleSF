import { describe, expect, it } from 'vitest';
import {
  chooseRewardCard,
  endTurn,
  getQuota,
  launchTurn,
  newGame,
  placeCard,
  removeCardFromDeck,
  rotateCard,
  tagCounts,
} from './game';
import { TERMINAL_INDEX, QUOTAS } from '../data/constants';
import { CARD_LIST } from '../data/cards';
import { ABOVE, S, boardWith } from './testUtils';
import type { GameState } from './types';

const totalCards = (s: GameState) =>
  s.hand.length + s.drawPile.length + s.discardPile.length + s.grid.filter((c, i) => c && i !== TERMINAL_INDEX).length;

function playScripted(seed: number): GameState {
  let s = newGame(seed);
  for (let turn = 0; turn < 3; turn++) {
    s = placeCard(s, 0, ABOVE);
    s = placeCard(s, 0, 11 + turn);
    s = rotateCard(s, ABOVE);
    s = launchTurn(s);
  }
  return s;
}

describe('determinism', () => {
  it('same seed gives the same result', () => {
    expect(playScripted(42)).toEqual(playScripted(42));
  });

  it('different seeds give different draws', () => {
    expect(newGame(1).hand.join() + newGame(1).drawPile.join()).not.toBe(
      newGame(2).hand.join() + newGame(3).drawPile.join(),
    );
    const hands = new Set(Array.from({ length: 20 }, (_, i) => newGame(i).hand.join()));
    expect(hands.size).toBeGreaterThan(1);
  });

  it('state survives a JSON round-trip', () => {
    const s = playScripted(7);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('deck, draw and reshuffle', () => {
  it('starts with a hand of 4 from a deck of 10', () => {
    const s = newGame(5);
    expect(s.hand).toHaveLength(4);
    expect(s.drawPile).toHaveLength(6);
    expect(totalCards(s)).toBe(10);
  });

  it('reshuffles the discard pile when the draw pile runs out', () => {
    let s = newGame(5);
    s = endTurn(s); // draw 6 -> 2
    expect(s.drawPile).toHaveLength(2);
    expect(s.discardPile).toHaveLength(4);
    s = endTurn(s); // needs 4, only 2 left -> reshuffle 8
    expect(s.hand).toHaveLength(4);
    expect(s.drawPile).toHaveLength(6);
    expect(s.discardPile).toHaveLength(0);
    expect(totalCards(s)).toBe(10);
  });

  it('draws fewer cards when the whole deck is on the grid', () => {
    const s = newGame(5, { conveyor: 1 });
    expect(s.hand).toHaveLength(1);
    expect(endTurn(s).hand).toHaveLength(1);
  });
});

describe('placement', () => {
  it('limits placements to 2 per turn', () => {
    let s = newGame(3);
    s = placeCard(s, 0, 0);
    s = placeCard(s, 0, 1);
    const blocked = placeCard(s, 0, 2);
    expect(blocked).toBe(s);
    expect(s.grid[2]).toBeNull();
    expect(s.placedThisTurn).toBe(2);
  });

  it('never replaces the Terminal', () => {
    const s = newGame(3);
    expect(placeCard(s, 0, TERMINAL_INDEX)).toBe(s);
  });

  it('defaults direction toward the Terminal if adjacent, else North', () => {
    let s = newGame(3);
    s = placeCard(s, 0, ABOVE);
    s = placeCard(s, 0, 0);
    expect(s.grid[ABOVE]?.dir).toBe(S);
    expect(s.grid[0]?.dir).toBe(0);
  });

  it('sends a replaced card to the discard pile', () => {
    let s = boardWith([{ cell: 0, defId: 'lab', dir: 0 }]);
    s = placeCard(s, 0, 0);
    expect(s.discardPile).toContain('lab');
    expect(s.grid[0]?.defId).not.toBe('lab');
  });

  it('rotates placed cards clockwise, without limit', () => {
    let s = boardWith([{ cell: 0, defId: 'conveyor', dir: 0 }]);
    for (let i = 0; i < 5; i++) s = rotateCard(s, 0);
    expect(s.grid[0]?.dir).toBe(1);
    expect(rotateCard(s, TERMINAL_INDEX)).toBe(s);
  });

  it('discards the unplayed hand when the turn ends', () => {
    let s = newGame(3);
    const hand = [...s.hand];
    s = placeCard(s, 0, 0);
    s = endTurn(s);
    expect(s.discardPile).toEqual(expect.arrayContaining(hand.slice(1)));
    expect(s.placedThisTurn).toBe(0);
  });
});

describe('contracts and quotas', () => {
  it('uses the configured quotas, then doubles', () => {
    QUOTAS.forEach((q, i) => expect(getQuota(i)).toBe(q));
    const last = QUOTAS[QUOTAS.length - 1] as number;
    expect(getQuota(QUOTAS.length)).toBe(last * 2);
    expect(getQuota(QUOTAS.length + 1)).toBe(last * 4);
  });

  function lastTurn(credits: number): GameState {
    const s = newGame(9);
    s.turnIndex = 2;
    s.contractCredits = credits;
    return s;
  }

  it('succeeds when the quota is met exactly', () => {
    const s = endTurn(lastTurn(getQuota(0)));
    expect(s.phase).toBe('reward');
    expect(s.rewardOptions).toHaveLength(3);
    expect(new Set(s.rewardOptions).size).toBe(3);
  });

  it('fails when the quota is missed', () => {
    expect(endTurn(lastTurn(getQuota(0) - 1)).phase).toBe('gameover');
  });

  it('does not resolve the contract before the third turn', () => {
    const s = newGame(9);
    s.contractCredits = 9999;
    expect(endTurn(s).phase).toBe('planning');
  });

  it('a reward card goes to the discard pile and starts the next contract', () => {
    let s = endTurn(lastTurn(getQuota(0)));
    const choice = s.rewardOptions[0] as string;
    s = chooseRewardCard(s, choice);
    expect(s.phase).toBe('planning');
    expect(s.contractIndex).toBe(1);
    expect(s.contractCredits).toBe(0);
    expect(s.turnIndex).toBe(0);
    expect(s.hand).toHaveLength(4);
    expect(totalCards(s)).toBe(11);
  });

  it('rejects a reward that was not offered', () => {
    const s = endTurn(lastTurn(getQuota(0)));
    const bogus = CARD_LIST.find((c) => !s.rewardOptions.includes(c.id))!.id;
    expect(chooseRewardCard(s, bogus)).toBe(s);
  });

  it('can remove a card from the deck instead', () => {
    let s = endTurn(lastTurn(getQuota(0)));
    const before = s.drawPile.length + s.discardPile.length;
    const id = (s.drawPile[0] ?? s.discardPile[0]) as string;
    s = removeCardFromDeck(s, id);
    expect(s.phase).toBe('planning');
    // 10 - removed, then a new hand of 4 was drawn from the piles.
    expect(totalCards(s)).toBe(9);
    expect(before).toBeGreaterThan(0);
  });

  it('weights rewards by rarity (roughly 60/30/10)', () => {
    const counts = { common: 0, uncommon: 0, rare: 0 };
    for (let seed = 0; seed < 600; seed++) {
      const start = lastTurn(getQuota(0));
      start.rngState = seed;
      const s = endTurn(start);
      for (const id of s.rewardOptions) counts[CARD_LIST.find((c) => c.id === id)!.rarity]++;
    }
    const total = counts.common + counts.uncommon + counts.rare;
    expect(counts.common / total).toBeGreaterThan(0.5);
    expect(counts.rare / total).toBeLessThan(0.2);
    expect(counts.uncommon / total).toBeGreaterThan(0.2);
  });
});

describe('tags', () => {
  it('counts tags of placed cards (hook for set bonuses)', () => {
    const s = boardWith([
      { cell: 0, defId: 'foundry', dir: 0 },
      { cell: 1, defId: 'module_assembler', dir: 0 },
    ]);
    expect(tagCounts(s)).toEqual({ industry: 2, tech: 1 });
  });
});
