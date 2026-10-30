import { CARDS } from '../data/cards';
import { RESOURCE_ICONS } from '../data/resources';
import { TERMINAL_INDEX } from '../data/constants';
import { resourceTotal } from '../engine';
import type { CardInstance, GameState, Resources } from '../engine';
import { accentFor, dirArrow, nonZero } from './format';
import { useLongPress } from './useLongPress';

export interface Float {
  id: number;
  amount: number;
}

interface CellProps {
  index: number;
  card: CardInstance | null;
  highlight: boolean;
  debug: boolean;
  floats: Float[];
  onTap: (index: number) => void;
  onInfo: (index: number) => void;
}

function DebugBuffer({ label, r }: { label: string; r: Resources }) {
  const items = nonZero(r);
  if (items.length === 0) return null;
  return (
    <div class="dbg-line">
      <b>{label}</b>
      {items.map(([id, n]) => (
        <span key={id}>
          {RESOURCE_ICONS[id]}
          {n}
        </span>
      ))}
    </div>
  );
}

function Cell({ index, card, highlight, debug, floats, onTap, onInfo }: CellProps) {
  const press = useLongPress(() => card && onInfo(index));
  const def = card ? CARDS[card.defId] : undefined;
  const isTerminal = index === TERMINAL_INDEX;
  const passive = def?.behavior.type === 'passive';
  const classes = [
    'cell',
    card ? 'placed' : 'empty',
    isTerminal ? 'terminal' : '',
    highlight ? (card ? 'replace' : 'valid') : '',
    card?.blocked ? 'blocked' : '',
  ].join(' ');

  return (
    <div
      class={classes}
      role="button"
      tabIndex={0}
      style={def ? { '--accent-card': accentFor(def) } : undefined}
      {...press.handlers}
      onClick={() => !press.wasLong() && onTap(index)}
    >
      {card && def && (
        <>
          <span class="cell-icon">{def.icon}</span>
          {!passive && !isTerminal && <span class={`arrow dir-${card.dir}`}>{dirArrow(card.dir)}</span>}
          {isTerminal ? (
            <span class="cell-label">Terminal</span>
          ) : debug ? (
            <div class="dbg">
              <DebugBuffer label="in" r={card.inbox} />
              <DebugBuffer label="out" r={card.outbox} />
            </div>
          ) : (
            !passive && (
              <div class="bufs">
                {resourceTotal(card.inbox) > 0 && (
                  <span class="buf in" title="Entrée">
                    {resourceTotal(card.inbox)}
                  </span>
                )}
                {resourceTotal(card.outbox) > 0 && (
                  <span class="buf out" title="Sortie">
                    {resourceTotal(card.outbox)}
                  </span>
                )}
              </div>
            )
          )}
          {!isTerminal && card.blocked && <span class="blocked-tag">⛔</span>}
          <button
            class="info-btn"
            aria-label="Détail"
            onClick={(e) => {
              e.stopPropagation();
              onInfo(index);
            }}
          >
            ⓘ
          </button>
        </>
      )}
      {isTerminal &&
        floats.map((f) => (
          <span key={f.id} class="float">
            +{f.amount}
          </span>
        ))}
    </div>
  );
}

export function Grid(props: {
  game: GameState;
  selectedHand: number | null;
  debug: boolean;
  floats: Float[];
  onTap: (index: number) => void;
  onInfo: (index: number) => void;
}) {
  const { game, selectedHand } = props;
  return (
    <div class="grid">
      {game.grid.map((card, i) => (
        <Cell
          key={i}
          index={i}
          card={card}
          highlight={selectedHand !== null && i !== TERMINAL_INDEX}
          debug={props.debug}
          floats={props.floats}
          onTap={props.onTap}
          onInfo={props.onInfo}
        />
      ))}
    </div>
  );
}
