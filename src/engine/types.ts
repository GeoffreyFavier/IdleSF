export type ResourceId = 'ore' | 'energy' | 'data' | 'alloy' | 'module';
export type Resources = Record<ResourceId, number>;

/** Directions, clockwise: 0 = North, 1 = East, 2 = South, 3 = West. */
export type Dir = 0 | 1 | 2 | 3;

export type Rarity = 'common' | 'uncommon' | 'rare';
export type Tag = 'mining' | 'energy' | 'logistics' | 'industry' | 'tech' | 'commerce';

export type PassiveEffect =
  /** Orthogonally adjacent sources produce `amount` more per tick. */
  | { kind: 'adjacentSourceBonus'; amount: number }
  /** If adjacent to the Terminal: `amount` extra credits per unit sold. */
  | { kind: 'terminalAdjacentSaleBonus'; amount: number }
  /** Units of `resource` sell for `factor` times their value. */
  | { kind: 'saleMultiplier'; resource: ResourceId; factor: number };

export type Behavior =
  | { type: 'source'; resource: ResourceId; amount: number }
  | { type: 'converter'; inputs: Partial<Resources>; outputs: Partial<Resources> }
  | {
      type: 'logistics';
      /** Max units moved inbox -> outbox per tick. */
      rate: number;
      /** Each unit moved comes out as this many units (default 1). */
      multiplier?: number;
      /** Distance of the target cell in the output direction (default 1). */
      range?: number;
      /** Alternate between the output direction and the one rotated 90° clockwise. */
      split?: boolean;
    }
  | { type: 'passive'; effects: PassiveEffect[] }
  | { type: 'terminal' };

export interface CardDef {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  tags: Tag[];
  behavior: Behavior;
  /** One-line effect shown in the UI. */
  summary: string;
  inboxCapacity?: number;
  outboxCapacity?: number;
  /** Max units sent per tick during the transfer phase. */
  throughput?: number;
}

/** A card placed on the grid. */
export interface CardInstance {
  uid: number;
  defId: string;
  dir: Dir;
  inbox: Resources;
  outbox: Resources;
  /** Splitter state: 0 = prefers the output direction, 1 = prefers the rotated one. */
  splitToggle: 0 | 1;
  blocked: boolean;
}

export type Phase = 'planning' | 'reward' | 'gameover';

export interface GameStats {
  totalCredits: number;
  contractsCompleted: number;
  cardsPlaced: number;
  ticks: number;
}

export interface GameState {
  seed: number;
  /** mulberry32 internal state. */
  rngState: number;
  phase: Phase;
  /** 0-based contract index. */
  contractIndex: number;
  /** 0-based turn index within the contract. */
  turnIndex: number;
  contractCredits: number;
  grid: (CardInstance | null)[];
  drawPile: string[];
  discardPile: string[];
  hand: string[];
  placedThisTurn: number;
  rewardOptions: string[];
  nextUid: number;
  /** Credits gained by the last simulated tick (for UI feedback). */
  lastTickCredits: number;
  stats: GameStats;
}
