import { useState } from 'preact/hooks';
import { CARDS } from '../data/cards';
import { getQuota, removableCards } from '../engine';
import type { GameState } from '../engine';
import { CardMini } from './Hand';

export function RewardScreen({
  game,
  onChoose,
  onRemove,
}: {
  game: GameState;
  onChoose: (defId: string) => void;
  onRemove: (defId: string) => void;
}) {
  const [mode, setMode] = useState<'pick' | 'remove'>('pick');
  const [choice, setChoice] = useState<string | null>(null);
  const removable = Object.entries(removableCards(game));

  const switchMode = (m: 'pick' | 'remove') => {
    setMode(m);
    setChoice(null);
  };
  const confirm = () => {
    if (choice === null) return;
    if (mode === 'pick') onChoose(choice);
    else onRemove(choice);
  };

  return (
    <div class="screen">
      <h1>Contrat réussi ✔</h1>
      <p class="muted">
        {game.contractCredits} / {getQuota(game.contractIndex)} crédits. Choisis ta récompense.
      </p>
      <div class="tabs">
        <button class={`tab${mode === 'pick' ? ' active' : ''}`} onClick={() => switchMode('pick')}>
          Nouvelle carte
        </button>
        <button class={`tab${mode === 'remove' ? ' active' : ''}`} onClick={() => switchMode('remove')}>
          Retirer une carte
        </button>
      </div>
      {mode === 'pick' ? (
        <div class="reward-cards">
          {game.rewardOptions.map((id) => {
            const def = CARDS[id];
            return def ? <CardMini key={id} def={def} selected={choice === id} onTap={() => setChoice(id)} /> : null;
          })}
        </div>
      ) : removable.length === 0 ? (
        <p class="hint">Aucune carte à retirer (toutes sont posées sur la grille).</p>
      ) : (
        <div class="reward-cards">
          {removable.map(([id, count]) => {
            const def = CARDS[id];
            return def ? (
              <div key={id} class="remove-item">
                <CardMini def={def} selected={choice === id} onTap={() => setChoice(id)} />
                <span class="count">×{count}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
      <button class="btn primary" disabled={choice === null} onClick={confirm}>
        {mode === 'pick' ? 'Prendre cette carte' : 'Retirer cette carte'}
      </button>
    </div>
  );
}

export function GameOverScreen({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const s = game.stats;
  return (
    <div class="screen">
      <h1>Contrat raté ✖</h1>
      <p class="muted">
        Contrat n°{game.contractIndex + 1} : {game.contractCredits} / {getQuota(game.contractIndex)} crédits.
      </p>
      <ul class="stats">
        <li>
          Contrats réussis : <b>{s.contractsCompleted}</b>
        </li>
        <li>
          Crédits totaux : <b>{s.totalCredits}</b>
        </li>
        <li>
          Cartes posées : <b>{s.cardsPlaced}</b>
        </li>
        <li>
          Ticks simulés : <b>{s.ticks}</b>
        </li>
      </ul>
      <button class="btn primary" onClick={onRestart}>
        Recommencer
      </button>
    </div>
  );
}
