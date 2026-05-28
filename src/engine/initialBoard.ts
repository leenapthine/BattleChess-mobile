import type { Piece, GameState, GainedAbilities, Color } from '@/types/game';
import type { ArmyConfig } from '@/types/army';
import { GUILD_PIECES } from '@/data/upgradeCosts';

const NO_ABILITIES: GainedAbilities = {
  knight: false,
  rook: false,
  queen: false,
  pawn: false,
};

function makePiece(
  id: number,
  type: Piece['type'],
  color: Color,
  row: number,
  col: number,
  overrides?: Partial<Piece>,
): Piece {
  return {
    id: String(id),
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
    gainedAbilities: { ...NO_ABILITIES },
    ...overrides,
  };
}

function buildArmy(config: ArmyConfig, color: Color, idOffset: number): Piece[] {
  const backRow = color === 'White' ? 0 : 7;
  const pawnRow = color === 'White' ? 1 : 6;
  const mapping = GUILD_PIECES[config.guild];
  const pieces: Piece[] = [];

  for (let i = 0; i < 8; i++) {
    const slot = config.slots[i];
    const type = slot.upgraded ? mapping[slot.role] : slot.role;
    const overrides: Partial<Piece> = {};
    if (type === 'GhoulKing') overrides.raisesLeft = 1;
    pieces.push(makePiece(idOffset + i, type, color, backRow, i, overrides));
  }

  for (let i = 0; i < 8; i++) {
    const slot = config.slots[8 + i];
    const type = slot.upgraded ? mapping[slot.role] : slot.role;
    pieces.push(makePiece(idOffset + 8 + i, type, color, pawnRow, i));
  }

  return pieces;
}

export function createInitialState(p1Army: ArmyConfig, p2Army: ArmyConfig): GameState {
  return {
    pieces: [...buildArmy(p1Army, 'White', 1), ...buildArmy(p2Army, 'Black', 17)],
    capturedPieces: [],
    currentTurn: 'White',
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    status: { type: 'active' },
    armyConfigs: { p1: p1Army, p2: p2Army },
  };
}
