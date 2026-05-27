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

function makeBeastWhite(): Piece[] {
  return [
    makePiece(1, 'BoulderThrower', 'White', 0, 0),
    makePiece(2, 'BeastKnight', 'White', 0, 1),
    makePiece(3, 'BeastDruid', 'White', 0, 2),
    makePiece(4, 'QueenOfDomination', 'White', 0, 3),
    makePiece(5, 'FrogKing', 'White', 0, 4),
    makePiece(6, 'BeastDruid', 'White', 0, 5),
    makePiece(7, 'BeastKnight', 'White', 0, 6),
    makePiece(8, 'BoulderThrower', 'White', 0, 7),
    ...Array.from({ length: 8 }, (_, i) =>
      makePiece(9 + i, 'PawnHopper', 'White', 1, i),
    ),
  ];
}

function makeWizardBlack(): Piece[] {
  return [
    makePiece(17, 'Portal', 'Black', 7, 0),
    makePiece(18, 'Familiar', 'Black', 7, 1),
    makePiece(19, 'WizardTower', 'Black', 7, 2),
    makePiece(20, 'QueenOfIllusions', 'Black', 7, 3),
    makePiece(21, 'WizardKing', 'Black', 7, 4),
    makePiece(22, 'WizardTower', 'Black', 7, 5),
    makePiece(23, 'Familiar', 'Black', 7, 6),
    makePiece(24, 'Portal', 'Black', 7, 7),
    ...Array.from({ length: 8 }, (_, i) =>
      makePiece(25 + i, 'YoungWiz', 'Black', 6, i),
    ),
  ];
}

export function createInitialState(): GameState {
  return {
    pieces: [...makeBeastWhite(), ...makeWizardBlack()],
    capturedPieces: [],
    currentTurn: 'White',
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    status: { type: 'active' },
  };
}
