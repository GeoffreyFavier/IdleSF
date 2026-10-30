import { TURNS_PER_CONTRACT } from '../data/constants';
import { getQuota } from '../engine';
import type { GameState } from '../engine';

export function Header({ game, onMenu }: { game: GameState; onMenu: () => void }) {
  const quota = getQuota(game.contractIndex);
  const pct = Math.min(100, (game.contractCredits / quota) * 100);
  const turn = Math.min(game.turnIndex + 1, TURNS_PER_CONTRACT);
  return (
    <header class="header">
      <div class="header-top">
        <span class="contract">Contrat n°{game.contractIndex + 1}</span>
        <span class="turn">
          Tour {turn}/{TURNS_PER_CONTRACT}
        </span>
        <button class="icon-btn" aria-label="Menu" onClick={onMenu}>
          ⚙
        </button>
      </div>
      <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={quota} aria-valuenow={game.contractCredits}>
        <div class={`progress-fill${pct >= 100 ? ' done' : ''}`} style={{ width: `${pct}%` }} />
        <span class="progress-label">
          💰 {game.contractCredits} / {quota}
        </span>
      </div>
    </header>
  );
}
