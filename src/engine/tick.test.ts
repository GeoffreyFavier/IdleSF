import { describe, expect, it } from 'vitest';
import { runTurn, simulateTick } from './tick';
import { TERMINAL_INDEX } from '../data/constants';
import { ABOVE, E, LEFT, N, S, W, boardWith } from './testUtils';
import type { CardInstance } from './types';

const cell = (s: { grid: (CardInstance | null)[] }, i: number) => s.grid[i] as CardInstance;

describe('transfer', () => {
  it('moves a source output to the Terminal and sells it', () => {
    let s = boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: S }]);
    s = simulateTick(s);
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(1);
    expect(s.contractCredits).toBe(0);
    s = simulateTick(s);
    expect(s.contractCredits).toBe(1);
    expect(runTurn(boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: S }]), 10).contractCredits).toBe(9);
  });

  it('blocks a source when the target inbox is full', () => {
    let s = boardWith([
      { cell: 2, defId: 'foundry', dir: S, inbox: { ore: 6 } },
      { cell: ABOVE, defId: 'asteroid_drill', dir: N },
    ]);
    s = runTurn(s, 10);
    expect(cell(s, ABOVE).outbox.ore).toBe(6);
    expect(cell(s, ABOVE).blocked).toBe(true);
    expect(cell(s, 2).inbox.ore).toBe(6);
  });

  it('marks nothing as blocked when the card can still send', () => {
    const s = runTurn(boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: S }]), 10);
    expect(cell(s, ABOVE).blocked).toBe(false);
  });

  it('does not send toward a missing cell or off the grid', () => {
    const s = runTurn(boardWith([{ cell: 0, defId: 'asteroid_drill', dir: N }]), 8);
    expect(cell(s, 0).outbox.ore).toBe(6);
    expect(cell(s, 0).blocked).toBe(true);
  });

  it('rejects resources a recipe does not use', () => {
    const s = simulateTick(
      boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: W }, { cell: 6, defId: 'lab', dir: S }]),
    );
    expect(cell(s, 6).inbox.ore).toBe(0);
    expect(cell(s, ABOVE).outbox.ore).toBe(1);
  });

  it('never moves a resource twice in one tick', () => {
    // Three conveyors in a row, ore waiting in the first outbox.
    let s = boardWith([
      { cell: 5, defId: 'conveyor', dir: E, outbox: { ore: 1 } },
      { cell: 6, defId: 'conveyor', dir: E },
      { cell: 7, defId: 'conveyor', dir: E },
    ]);
    s = simulateTick(s);
    expect(cell(s, 5).outbox.ore).toBe(0);
    expect(cell(s, 6).inbox.ore).toBe(1);
    expect(cell(s, 6).outbox.ore).toBe(0);
    expect(cell(s, 7).inbox.ore).toBe(0);
    s = simulateTick(s);
    expect(cell(s, 7).inbox.ore).toBe(1);
  });

  it('resolves conflicts in row-major order', () => {
    // Two sources feed a conveyor with room for one more unit: the lower index wins.
    let s = boardWith([
      { cell: 5, defId: 'asteroid_drill', dir: E },
      { cell: 7, defId: 'solar_panel', dir: W },
      { cell: 6, defId: 'conveyor', dir: N, inbox: { data: 5 }, outbox: { data: 6 } },
    ]);
    s = simulateTick(s);
    expect(cell(s, 6).inbox.ore).toBe(1);
    expect(cell(s, 6).inbox.energy).toBe(0);
  });
});

describe('conversion', () => {
  it('Foundry turns 2 ore + 1 energy into 1 alloy, once per tick', () => {
    let s = boardWith([{ cell: ABOVE, defId: 'foundry', dir: S, inbox: { ore: 4, energy: 2 } }]);
    s = simulateTick(s);
    expect(cell(s, ABOVE).inbox).toMatchObject({ ore: 2, energy: 1 });
    expect(cell(s, TERMINAL_INDEX).inbox.alloy).toBe(1);
    s = simulateTick(s);
    expect(s.contractCredits).toBe(6);
    expect(cell(s, ABOVE).inbox).toMatchObject({ ore: 0, energy: 0 });
  });

  it('does not convert without a full recipe', () => {
    const s = simulateTick(boardWith([{ cell: ABOVE, defId: 'foundry', dir: S, inbox: { ore: 1, energy: 1 } }]));
    expect(cell(s, TERMINAL_INDEX).inbox.alloy).toBe(0);
  });
});

describe('logistics', () => {
  it('Splitter alternates between its output and the one rotated clockwise', () => {
    // Facing South: output is the Terminal (12), rotated output is West (6).
    const s = simulateTick(
      boardWith([
        { cell: ABOVE, defId: 'splitter', dir: S, outbox: { ore: 3 } },
        { cell: 6, defId: 'conveyor', dir: N },
      ]),
    );
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(2);
    expect(cell(s, 6).inbox.ore).toBe(1);
  });

  it('Splitter falls back to the other output when one refuses', () => {
    const s = simulateTick(boardWith([{ cell: ABOVE, defId: 'splitter', dir: S, outbox: { ore: 3 } }]));
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(3);
  });

  it('Cargo drone skips the neighbouring cell', () => {
    const s = simulateTick(
      boardWith([
        { cell: 2, defId: 'cargo_drone', dir: S, outbox: { ore: 3 } },
        { cell: ABOVE, defId: 'conveyor', dir: S },
      ]),
    );
    expect(cell(s, ABOVE).inbox.ore).toBe(0);
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(3);
  });

  it('Quantum amplifier doubles resources, 2 inputs per tick', () => {
    const s = simulateTick(
      boardWith([{ cell: ABOVE, defId: 'quantum_amplifier', dir: S, inbox: { ore: 3 } }]),
    );
    expect(cell(s, ABOVE).inbox.ore).toBe(1);
    // 2 inputs -> 4 units in outbox; throughput 3 sends 3, 1 remains.
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(3);
    expect(cell(s, ABOVE).outbox.ore).toBe(1);
  });

  it('Silo holds 12 and moves 2 per tick', () => {
    const s = simulateTick(boardWith([{ cell: ABOVE, defId: 'buffer_silo', dir: S, inbox: { ore: 12 } }]));
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(2);
    expect(cell(s, ABOVE).inbox.ore).toBe(10);
  });
});

describe('passives', () => {
  it('Control relay adds +1 production to adjacent sources', () => {
    const s = simulateTick(
      boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: S }, { cell: 6, defId: 'control_relay', dir: N }]),
    );
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(2);
  });

  it('Control relay does not affect diagonal sources', () => {
    const s = simulateTick(
      boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: S }, { cell: 1, defId: 'control_relay', dir: N }]),
    );
    expect(cell(s, TERMINAL_INDEX).inbox.ore).toBe(1);
  });

  it('Broker adds +1 credit per unit sold only when adjacent to the Terminal', () => {
    const inbox = { ore: 2 };
    const adjacent = simulateTick(withTerminalInbox(inbox, [{ cell: LEFT, defId: 'broker', dir: N }]));
    expect(adjacent.contractCredits).toBe(4);
    const far = simulateTick(withTerminalInbox(inbox, [{ cell: 0, defId: 'broker', dir: N }]));
    expect(far.contractCredits).toBe(2);
  });

  it('Export contract doubles alloy sales and stacks with the broker flat bonus', () => {
    const alloy = withTerminalInbox({ alloy: 1 }, [{ cell: 0, defId: 'export_contract', dir: N }]);
    expect(simulateTick(alloy).contractCredits).toBe(12);
    const both = withTerminalInbox({ alloy: 1 }, [
      { cell: 0, defId: 'export_contract', dir: N },
      { cell: LEFT, defId: 'broker', dir: N },
    ]);
    expect(simulateTick(both).contractCredits).toBe(13);
  });
});

describe('purity and determinism', () => {
  it('simulateTick does not mutate its input', () => {
    const s = boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: S }]);
    const before = JSON.stringify(s);
    simulateTick(s);
    runTurn(s, 10);
    expect(JSON.stringify(s)).toBe(before);
  });

  it('runTurn equals repeated simulateTick', () => {
    let a = boardWith([{ cell: ABOVE, defId: 'asteroid_drill', dir: S }]);
    const b = runTurn(a, 7);
    for (let i = 0; i < 7; i++) a = simulateTick(a);
    expect(a).toEqual(b);
  });
});

function withTerminalInbox(inbox: Partial<Record<'ore' | 'alloy', number>>, placements: Parameters<typeof boardWith>[0]) {
  const s = boardWith(placements);
  Object.assign(cell(s, TERMINAL_INDEX).inbox, inbox);
  return s;
}
