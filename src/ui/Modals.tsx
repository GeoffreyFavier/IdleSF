import { CARDS } from '../data/cards';
import { RESOURCE_ICONS, RESOURCE_LABELS, TAG_LABELS } from '../data/resources';
import type { CardInstance } from '../engine';
import { DIR_NAMES, RARITY_LABELS, nonZero, statLines } from './format';

export type DetailTarget = { defId: string; card?: CardInstance };

function BufferRow({ label, items }: { label: string; items: ReturnType<typeof nonZero> }) {
  return (
    <div class="detail-buffer">
      <b>{label}</b>
      {items.length === 0 ? (
        <span class="muted">vide</span>
      ) : (
        items.map(([id, n]) => (
          <span key={id} style={{ color: `var(--res-${id})` }}>
            {RESOURCE_ICONS[id]} {n} {RESOURCE_LABELS[id]}
          </span>
        ))
      )}
    </div>
  );
}

export function CardDetail({ target, onClose }: { target: DetailTarget; onClose: () => void }) {
  const def = CARDS[target.defId];
  if (!def) return null;
  const card = target.card;
  const hasBuffers = def.behavior.type !== 'passive';
  return (
    <div class="modal-backdrop" onClick={onClose}>
      <div class={`modal rarity-${def.rarity}`} onClick={(e) => e.stopPropagation()}>
        <div class="detail-head">
          <span class="detail-icon">{def.icon}</span>
          <div>
            <h2>{def.name}</h2>
            <div class="muted">
              {RARITY_LABELS[def.rarity]} · {def.tags.map((t) => TAG_LABELS[t]).join(', ')}
            </div>
          </div>
        </div>
        <p class="detail-effect">{def.summary}</p>
        {statLines(def).map((l) => (
          <p key={l} class="muted">
            {l}
          </p>
        ))}
        {card && def.behavior.type !== 'passive' && def.behavior.type !== 'terminal' && (
          <p>
            Direction : <b>{DIR_NAMES[card.dir]}</b>
            {card.blocked && <b class="warn"> · ⛔ Bloquée</b>}
          </p>
        )}
        {card && hasBuffers && (
          <>
            <BufferRow label="Entrée" items={nonZero(card.inbox)} />
            {def.behavior.type !== 'terminal' && <BufferRow label="Sortie" items={nonZero(card.outbox)} />}
          </>
        )}
        <button class="btn" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}

export function MenuModal({
  debug,
  onToggleDebug,
  onRestart,
  onClose,
}: {
  debug: boolean;
  onToggleDebug: () => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  return (
    <div class="modal-backdrop" onClick={onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Menu</h2>
        <label class="switch-row">
          <span>Mode debug (tick par tick, tampons détaillés)</span>
          <input type="checkbox" checked={debug} onChange={onToggleDebug} />
        </label>
        <button
          class="btn danger"
          onClick={() => {
            if (window.confirm('Abandonner la partie en cours et recommencer ?')) onRestart();
          }}
        >
          Recommencer
        </button>
        <button class="btn" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
