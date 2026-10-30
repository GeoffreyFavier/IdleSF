import { useEffect, useRef, useState } from 'preact/hooks';
import { CARDS } from '../data/cards';
import { MAX_PLACEMENTS_PER_TURN, TERMINAL_INDEX, TICKS_PER_TURN } from '../data/constants';
import {
  canPlace,
  chooseRewardCard,
  endTurn,
  newGame,
  placeCard,
  placementsLeft,
  removeCardFromDeck,
  rotateCard,
  runTurn,
  simulateTick,
} from '../engine';
import type { GameState } from '../engine';
import { Grid } from './Grid';
import type { Float } from './Grid';
import { Hand } from './Hand';
import { Header } from './Header';
import { CardDetail, MenuModal } from './Modals';
import type { DetailTarget } from './Modals';
import { GameOverScreen, RewardScreen } from './Screens';
import { loadDebug, loadGame, saveDebug, saveGame } from './storage';

const TICK_MS = 250;
const FLOAT_MS = 900;

/** `done` = ticks simulated so far this turn; `auto` = timer-driven (off in debug mode). */
interface RunState {
  done: number;
  auto: boolean;
}

export function App() {
  const [game, setGame] = useState<GameState>(() => loadGame() ?? newGame(Date.now()));
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [debug, setDebug] = useState(loadDebug);
  const [run, setRun] = useState<RunState | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const floatId = useRef(0);

  // Autosave at stable points only (not mid-run: a reload simply replays the turn).
  useEffect(() => {
    if (!run) saveGame(game);
  }, [game, run]);

  const addFloat = (amount: number) => {
    if (amount <= 0) return;
    const id = ++floatId.current;
    setFloats((f) => [...f, { id, amount }]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), FLOAT_MS);
  };

  const advance = () => {
    const next = simulateTick(game);
    setGame(next);
    addFloat(next.lastTickCredits);
    setRun((r) => (r ? { ...r, done: r.done + 1 } : r));
  };

  const finishTurn = () => {
    setGame((g) => endTurn(g));
    setRun(null);
    setSelected(null);
  };

  const skip = () => {
    if (!run) return;
    const before = game.contractCredits;
    const after = runTurn(game, TICKS_PER_TURN - run.done);
    addFloat(after.contractCredits - before);
    setGame(endTurn(after));
    setRun(null);
    setSelected(null);
  };

  // Timer-driven playback: one tick per TICK_MS, then end the turn.
  useEffect(() => {
    if (!run?.auto) return;
    const t = window.setTimeout(run.done >= TICKS_PER_TURN ? finishTurn : advance, run.done >= TICKS_PER_TURN ? 450 : TICK_MS);
    return () => window.clearTimeout(t);
  }, [run, game]);

  const launch = () => {
    setSelected(null);
    setRun({ done: 0, auto: !debug });
  };

  const toggleDebug = () => {
    const next = !debug;
    setDebug(next);
    saveDebug(next);
    setRun((r) => (r ? { ...r, auto: !next } : r));
  };

  const restart = () => {
    setGame(newGame(Date.now()));
    setRun(null);
    setSelected(null);
    setMenuOpen(false);
  };

  const openCellDetail = (index: number) => {
    const card = game.grid[index];
    if (card) setDetail({ defId: card.defId, card });
  };

  const onCellTap = (index: number) => {
    const card = game.grid[index];
    if (index === TERMINAL_INDEX || run) {
      openCellDetail(index);
      return;
    }
    if (selected !== null) {
      if (canPlace(game, selected, index)) {
        setGame(placeCard(game, selected, index));
        setSelected(null);
      }
      return;
    }
    if (!card) return;
    if (CARDS[card.defId]?.behavior.type === 'passive') openCellDetail(index);
    else setGame(rotateCard(game, index));
  };

  const onHandSelect = (i: number) => {
    if (run || placementsLeft(game) === 0) return;
    setSelected((s) => (s === i ? null : i));
  };

  const left = placementsLeft(game);
  const planning = game.phase === 'planning';

  return (
    <div class="app">
      <Header game={game} onMenu={() => setMenuOpen(true)} />
      <main class="board">
        <Grid
          game={game}
          selectedHand={planning && !run ? selected : null}
          debug={debug}
          floats={floats}
          onTap={onCellTap}
          onInfo={openCellDetail}
        />
        <div class="controls">
          <span class="poses">
            Poses : {left}/{MAX_PLACEMENTS_PER_TURN}
          </span>
          {!run ? (
            <button class="btn primary launch" disabled={!planning} onClick={launch}>
              ▶ Lancer
            </button>
          ) : debug ? (
            <>
              <button class="btn" disabled={run.done >= TICKS_PER_TURN} onClick={advance}>
                Tick +1 ({run.done}/{TICKS_PER_TURN})
              </button>
              <button class="btn primary" onClick={run.done >= TICKS_PER_TURN ? finishTurn : skip}>
                {run.done >= TICKS_PER_TURN ? 'Fin du tour' : 'Terminer'}
              </button>
            </>
          ) : (
            <>
              <span class="tick-count">
                Tick {Math.min(run.done, TICKS_PER_TURN)}/{TICKS_PER_TURN}
              </span>
              <button class="btn" onClick={skip}>
                Passer ⏭
              </button>
            </>
          )}
        </div>
        <p class="legend">
          <span class="buf in">0</span> entrée <span class="buf out">0</span> sortie · taper une carte posée = pivoter
        </p>
      </main>
      <Hand
        hand={game.hand}
        selected={selected}
        disabled={!!run || left === 0}
        onSelect={onHandSelect}
        onInfo={(defId) => setDetail({ defId })}
      />

      {game.phase === 'reward' && (
        <RewardScreen
          game={game}
          onChoose={(id) => setGame(chooseRewardCard(game, id))}
          onRemove={(id) => setGame(removeCardFromDeck(game, id))}
        />
      )}
      {game.phase === 'gameover' && <GameOverScreen game={game} onRestart={restart} />}
      {detail && <CardDetail target={detail} onClose={() => setDetail(null)} />}
      {menuOpen && (
        <MenuModal debug={debug} onToggleDebug={toggleDebug} onRestart={restart} onClose={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
