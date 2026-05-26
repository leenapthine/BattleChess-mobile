import type { Piece, GameState, GainedAbilities } from '@/types/game';

const NO_ABILITIES: GainedAbilities = {
  knight: false,
  rook: false,
  queen: false,
  pawn: false,
};

function makePiece(
  id: number,
  type: Piece['type'],
  color: Piece['color'],
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

function makeNecroWhite(): Piece[] {
  return [
    makePiece(1, 'DeadLauncher', 'White', 0, 0),
    makePiece(2, 'GhostKnight', 'White', 0, 1),
    makePiece(3, 'Necromancer', 'White', 0, 2),
    makePiece(4, 'QueenOfBones', 'White', 0, 3),
    makePiece(5, 'GhoulKing', 'White', 0, 4, { raisesLeft: 1 }),
    makePiece(6, 'Necromancer', 'White', 0, 5),
    makePiece(7, 'GhostKnight', 'White', 0, 6),
    makePiece(8, 'DeadLauncher', 'White', 0, 7),
    ...Array.from({ length: 8 }, (_, i) =>
      makePiece(9 + i, 'NecroPawn', 'White', 1, i),
    ),
  ];
}

function makeDemonBlack(): Piece[] {
  return [
    makePiece(17, 'Beholder', 'Black', 7, 0),
    makePiece(18, 'Prowler', 'Black', 7, 1),
    makePiece(19, 'Howler', 'Black', 7, 2),
    makePiece(20, 'QueenOfDestruction', 'Black', 7, 3),
    makePiece(21, 'HellKing', 'Black', 7, 4),
    makePiece(22, 'Howler', 'Black', 7, 5),
    makePiece(23, 'Prowler', 'Black', 7, 6),
    makePiece(24, 'Beholder', 'Black', 7, 7),
    ...Array.from({ length: 8 }, (_, i) =>
      makePiece(25 + i, 'HellPawn', 'Black', 6, i),
    ),
  ];
}

export function createInitialState(): GameState {
  return {
    pieces: [...makeNecroWhite(), ...makeDemonBlack()],
    currentTurn: 'White',
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    status: { type: 'active' },
  };
}
