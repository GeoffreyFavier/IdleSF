import type { Rarity, ResourceId } from '../engine/types';

export const GRID_SIZE = 5;
/** Terminal sits at the centre of the grid (row-major index). */
export const TERMINAL_INDEX = 12;

export const HAND_SIZE = 4;
export const MAX_PLACEMENTS_PER_TURN = 2;
export const TICKS_PER_TURN = 10;
export const TURNS_PER_CONTRACT = 3;

export const DEFAULT_INBOX_CAPACITY = 6;
export const DEFAULT_OUTBOX_CAPACITY = 6;
export const DEFAULT_THROUGHPUT = 3;
export const TERMINAL_INBOX_CAPACITY = 12;

export const RESOURCE_VALUES: Record<ResourceId, number> = {
  ore: 1,
  energy: 1,
  data: 3,
  alloy: 6,
  module: 20,
};

/** Quotas of the first contracts; later ones multiply the last by QUOTA_GROWTH_FACTOR. */
export const QUOTAS = [40, 100, 220, 450, 900];
export const QUOTA_GROWTH_FACTOR = 2;

export const STARTING_DECK: Record<string, number> = {
  asteroid_drill: 3,
  solar_panel: 3,
  conveyor: 3,
  foundry: 1,
};

export const REWARD_CHOICES = 3;
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  uncommon: 30,
  rare: 10,
};
