import type { ResourceId, Tag } from '../engine/types';

/** Fixed processing order: keeps resolution deterministic. */
export const RESOURCE_ORDER: ResourceId[] = ['ore', 'energy', 'data', 'alloy', 'module'];

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  ore: 'Minerai',
  energy: 'Énergie',
  data: 'Données',
  alloy: 'Alliage',
  module: 'Module',
};

export const RESOURCE_ICONS: Record<ResourceId, string> = {
  ore: '🪨',
  energy: '⚡',
  data: '💾',
  alloy: '🔩',
  module: '📦',
};

export const TAG_LABELS: Record<Tag, string> = {
  mining: 'Minage',
  energy: 'Énergie',
  logistics: 'Logistique',
  industry: 'Industrie',
  tech: 'Tech',
  commerce: 'Commerce',
};
