export type Color = 'White' | 'Black';

export type BasicPieceType =
  | 'Pawn'
  | 'Knight'
  | 'Bishop'
  | 'Rook'
  | 'Queen'
  | 'King';

export type NecroPieceType =
  | 'NecroPawn'
  | 'GhostKnight'
  | 'Necromancer'
  | 'DeadLauncher'
  | 'GhoulKing'
  | 'QueenOfBones';

export type DemonPieceType =
  | 'HellPawn'
  | 'Prowler'
  | 'Howler'
  | 'Beholder'
  | 'HellKing'
  | 'QueenOfDestruction';

export type BeastPieceType =
  | 'PawnHopper'
  | 'BeastKnight'
  | 'BeastDruid'
  | 'BoulderThrower'
  | 'FrogKing'
  | 'QueenOfDomination';

export type WizardPieceType =
  | 'YoungWiz'
  | 'Familiar'
  | 'WizardTower'
  | 'Portal'
  | 'WizardKing'
  | 'QueenOfIllusions';

export type PieceType =
  | BasicPieceType
  | NecroPieceType
  | DemonPieceType
  | BeastPieceType
  | WizardPieceType;

export type GainedAbilities = {
  knight: boolean;
  rook: boolean;
  queen: boolean;
  pawn: boolean;
};

export type Square = {
  row: number;
  col: number;
};

export type Piece = {
  id: string;
  type: PieceType;
  color: Color;
  row: number;
  col: number;
  hasMoved: boolean;
  stunned: boolean;
  isStone: boolean;
  pawnLoaded: boolean;
  pieceLoaded: Piece | null;
  raisesLeft: number;
  gainedAbilities: GainedAbilities;
};

export type HighlightColor = 'move' | 'capture' | 'ability' | 'preview' | 'range';

export type Highlight = Square & {
  color: HighlightColor;
};

export type AbilityMode =
  | { type: 'none' }
  | { type: 'sacrifice'; pieceId: string; armed: boolean }
  | { type: 'resurrection'; color: Color; targets: Square[] }
  | { type: 'loading'; pieceId: string }
  | { type: 'launch'; pieceId: string }
  | { type: 'boulder'; pieceId: string }
  | { type: 'domination'; pieceId: string }
  | { type: 'secondMove'; pieceId: string }
  | { type: 'sacrificeSelection'; queenColor: Color; sacrificeIds: string[]; pendingSecondMove: string | null };

export type GameStatus =
  | { type: 'active' }
  | { type: 'won'; winner: Color };

export type GameState = {
  pieces: Piece[];
  capturedPieces: Piece[];
  currentTurn: Color;
  selectedSquare: Square | null;
  highlights: Highlight[];
  abilityMode: AbilityMode;
  status: GameStatus;
  armyConfigs?: { p1: import('@/types/army').ArmyConfig; p2: import('@/types/army').ArmyConfig };
};

export type GameAction =
  | { type: 'SELECT_SQUARE'; square: Square }
  | { type: 'MOVE_PIECE'; from: Square; to: Square }
  | { type: 'ABILITY_ACTION'; square: Square }
  | { type: 'END_TURN' }
  | { type: 'DESELECT' }
  | { type: 'RESET_GAME' };
