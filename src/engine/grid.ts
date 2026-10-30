import { GRID_SIZE } from '../data/constants';
import { RESOURCE_ORDER } from '../data/resources';
import type { Dir, ResourceId, Resources } from './types';

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export function rotateDir(dir: Dir, steps = 1): Dir {
  return ((((dir + steps) % 4) + 4) % 4) as Dir;
}

export function cellRow(index: number): number {
  return Math.floor(index / GRID_SIZE);
}

export function cellCol(index: number): number {
  return index % GRID_SIZE;
}

/** Index of the cell `distance` steps away in `dir`, or null when off-grid. */
export function neighborIndex(index: number, dir: Dir, distance = 1): number | null {
  const col = cellCol(index) + (DX[dir] ?? 0) * distance;
  const row = cellRow(index) + (DY[dir] ?? 0) * distance;
  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;
  return row * GRID_SIZE + col;
}

export function orthogonalNeighbors(index: number): number[] {
  const result: number[] = [];
  for (const dir of [0, 1, 2, 3] as Dir[]) {
    const n = neighborIndex(index, dir);
    if (n !== null) result.push(n);
  }
  return result;
}

/** Direction from `from` to the orthogonally adjacent cell `to`, or null. */
export function dirToward(from: number, to: number): Dir | null {
  for (const dir of [0, 1, 2, 3] as Dir[]) {
    if (neighborIndex(from, dir) === to) return dir;
  }
  return null;
}

export function emptyResources(): Resources {
  return { ore: 0, energy: 0, data: 0, alloy: 0, module: 0 };
}

export function resourceTotal(r: Resources): number {
  let total = 0;
  for (const id of RESOURCE_ORDER) total += r[id];
  return total;
}

export function hasResources(r: Resources): boolean {
  return resourceTotal(r) > 0;
}

export type { ResourceId };
