import type { Piece, PieceType, Color, GameState, GainedAbilities } from '@/types/game';
import type { ArmyConfig } from '@/types/army';
import { createDefaultArmy } from '@/types/army';
import { createInitialState } from '@/engine/initialBoard';

let nextId = 1;

const DEFAULT_ABILITIES: GainedAbilities = {
  knight: false,
  rook: false,
  queen: false,
  pawn: false,
};

export function makePiece(
  type: PieceType,
  color: Color,
  row: number,
  col: number,
  overrides?: Partial<Piece>,
): Piece {
  return {
    id: String(nextId++),
    type,
    color,
    row,
    col,
    hasMoved: false,
    stunned: false,
    isStone: false,
    pawnLoaded: false,
    pieceLoaded: null,
    raisesLeft: 0,
    gainedAbilities: { ...DEFAULT_ABILITIES },
    ...overrides,
  };
}

export function makeState(pieces: Piece[], overrides?: Partial<GameState>): GameState {
  return {
    pieces,
    capturedPieces: [],
    currentTurn: 'White',
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    status: { type: 'active' },
    armyConfigs: {
      p1: makeFullyUpgradedArmy('Beast'),
      p2: makeFullyUpgradedArmy('Wizard'),
    },
    ...overrides,
  };
}

export function resetIds(): void {
  nextId = 1;
}

export function makeFullyUpgradedArmy(guild: ArmyConfig['guild']): ArmyConfig {
  const army = createDefaultArmy(guild);
  return { ...army, slots: army.slots.map(s => ({ ...s, upgraded: true })) };
}

export function createTestState(): GameState {
  return createInitialState(
    makeFullyUpgradedArmy('Beast'),
    makeFullyUpgradedArmy('Wizard'),
  );
}

export function squaresList(highlights: { row: number; col: number }[]): string[] {
  return highlights.map(h => `${h.row},${h.col}`).sort();
}

export function hasSquare(
  highlights: { row: number; col: number }[],
  row: number,
  col: number,
): boolean {
  return highlights.some(h => h.row === row && h.col === col);
}
