import { RESOURCE_LABELS } from '../data/resources';
import { RESOURCE_ORDER } from '../data/resources';
import { inboxCapacity, outboxCapacity, sendThroughput } from '../engine/cards';
import type { CardDef, Dir, Rarity, ResourceId, Resources } from '../engine/types';

export const DIR_ARROWS = ['▲', '▶', '▼', '◀'];
export const DIR_NAMES = ['Nord', 'Est', 'Sud', 'Ouest'];

export function dirArrow(dir: Dir): string {
  return DIR_ARROWS[dir] ?? '▲';
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Commune',
  uncommon: 'Peu commune',
  rare: 'Rare',
};

/** CSS color (variable) that identifies a card: its main resource, else its rarity. */
export function accentFor(def: CardDef): string {
  const b = def.behavior;
  if (b.type === 'source') return `var(--res-${b.resource})`;
  if (b.type === 'converter') {
    const out = Object.keys(b.outputs)[0];
    if (out) return `var(--res-${out})`;
  }
  if (b.type === 'terminal') return 'var(--accent)';
  return `var(--rarity-${def.rarity})`;
}

export function nonZero(r: Resources): [ResourceId, number][] {
  return RESOURCE_ORDER.filter((id) => r[id] > 0).map((id) => [id, r[id]]);
}

export function formatAmounts(r: Partial<Resources>): string {
  return RESOURCE_ORDER.filter((id) => (r[id] ?? 0) > 0)
    .map((id) => `${r[id]} ${RESOURCE_LABELS[id]}`)
    .join(' + ');
}

export function statLines(def: CardDef): string[] {
  const b = def.behavior;
  if (b.type === 'passive') return ['Effet passif : pas de tampons.'];
  if (b.type === 'terminal') return [`Entrée : ${inboxCapacity(def)} — vend tout à chaque tick.`];
  const lines = [
    `Entrée : ${inboxCapacity(def)} · Sortie : ${outboxCapacity(def)} · Envoi : ${sendThroughput(def)}/tick`,
  ];
  if (b.type === 'converter') lines.push(`Recette : ${formatAmounts(b.inputs)} → ${formatAmounts(b.outputs)}`);
  if (b.type === 'logistics') lines.push(`Débit interne : ${b.rate}/tick`);
  return lines;
}
