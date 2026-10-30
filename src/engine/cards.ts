import {
  DEFAULT_INBOX_CAPACITY,
  DEFAULT_OUTBOX_CAPACITY,
  DEFAULT_THROUGHPUT,
  TERMINAL_INBOX_CAPACITY,
} from '../data/constants';
import { CARDS } from '../data/cards';
import { resourceTotal } from './grid';
import type { CardDef, CardInstance, ResourceId } from './types';

export function getDef(defId: string): CardDef {
  const def = CARDS[defId];
  if (!def) throw new Error(`Unknown card: ${defId}`);
  return def;
}

export function inboxCapacity(def: CardDef): number {
  if (def.inboxCapacity !== undefined) return def.inboxCapacity;
  switch (def.behavior.type) {
    case 'source':
    case 'passive':
      return 0;
    case 'terminal':
      return TERMINAL_INBOX_CAPACITY;
    default:
      return DEFAULT_INBOX_CAPACITY;
  }
}

export function outboxCapacity(def: CardDef): number {
  if (def.outboxCapacity !== undefined) return def.outboxCapacity;
  const t = def.behavior.type;
  return t === 'passive' || t === 'terminal' ? 0 : DEFAULT_OUTBOX_CAPACITY;
}

export function sendThroughput(def: CardDef): number {
  return def.throughput ?? DEFAULT_THROUGHPUT;
}

/**
 * How many more units of `res` the card's inbox can take.
 * Converters cap each ingredient separately (see docs/QUESTIONS.md #1);
 * logistics and the Terminal cap the total.
 */
export function inboxRoom(card: CardInstance, def: CardDef, res: ResourceId): number {
  const cap = inboxCapacity(def);
  const b = def.behavior;
  if (b.type === 'converter') {
    if (!(res in b.inputs)) return 0;
    return Math.max(0, cap - card.inbox[res]);
  }
  if (b.type === 'logistics' || b.type === 'terminal') {
    return Math.max(0, cap - resourceTotal(card.inbox));
  }
  return 0;
}

export function outboxRoom(card: CardInstance, def: CardDef): number {
  return Math.max(0, outboxCapacity(def) - resourceTotal(card.outbox));
}
