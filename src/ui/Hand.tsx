import { CARDS } from '../data/cards';
import { TAG_LABELS } from '../data/resources';
import type { CardDef } from '../engine';
import { accentFor } from './format';
import { useLongPress } from './useLongPress';

export function CardMini({
  def,
  selected,
  disabled,
  onTap,
  onInfo,
}: {
  def: CardDef;
  selected?: boolean;
  disabled?: boolean;
  onTap?: () => void;
  onInfo?: () => void;
}) {
  const press = useLongPress(() => onInfo?.());
  return (
    <div
      class={`card-mini rarity-${def.rarity}${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      role="button"
      tabIndex={0}
      style={{ '--accent-card': accentFor(def) }}
      {...press.handlers}
      onClick={() => !press.wasLong() && onTap?.()}
    >
      {onInfo && (
        <button
          class="info-btn"
          aria-label="Détail"
          onClick={(e) => {
            e.stopPropagation();
            onInfo();
          }}
        >
          ⓘ
        </button>
      )}
      <span class="card-icon">{def.icon}</span>
      <span class="card-name">{def.name}</span>
      <span class="card-tags">{def.tags.map((t) => TAG_LABELS[t]).join(' · ')}</span>
      <span class="card-effect">{def.summary}</span>
    </div>
  );
}

export function Hand({
  hand,
  selected,
  disabled,
  onSelect,
  onInfo,
}: {
  hand: string[];
  selected: number | null;
  disabled: boolean;
  onSelect: (i: number) => void;
  onInfo: (defId: string) => void;
}) {
  return (
    <div class="hand">
      {hand.map((id, i) => {
        const def = CARDS[id];
        return def ? (
          <CardMini
            key={`${id}-${i}`}
            def={def}
            selected={selected === i}
            disabled={disabled}
            onTap={() => onSelect(i)}
            onInfo={() => onInfo(id)}
          />
        ) : null;
      })}
      {hand.length === 0 && <p class="hint">Plus de cartes en main.</p>}
    </div>
  );
}
