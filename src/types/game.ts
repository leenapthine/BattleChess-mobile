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
  loadedPawnType?: PieceType; // DeadLauncher: which pawn-type it loaded (for launch sprite)
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

export type WinReason = 'kingCapture' | 'resign' | 'timeout';

export type GameStatus =
  | { type: 'active' }
  | { type: 'won'; winner: Color; reason?: WinReason };

// Visual effect events emitted by the reducer for ability animations.
// The UI watches GameState.lastEffect; each non-null value triggers the
// matching Reanimated animation. Cleared (set to null) at the top of
// every reducer call so previous effects don't re-fire.
export type Effect =
  | { type: 'detonate'; from: Square; affected: Square[] }
  | { type: 'launch'; from: Square; to: Square; spriteColor: Color; spriteType: PieceType }
  | { type: 'beam'; from: Square; to: Square }
  | { type: 'boulder'; from: Square; to: Square }
  | { type: 'kingShot'; from: Square; to: Square }
  | { type: 'zap'; from: Square; to: Square }
  | { type: 'towerShot'; from: Square; to: Square }
  | { type: 'raise'; from: Square; at: Square }
  | { type: 'revive'; at: Square }
  | { type: 'transform'; at: Square }
  | { type: 'convert'; at: Square }
  | { type: 'stun'; from: Square; affected: Square[] }
  | { type: 'dominate'; from: Square; to: Square }
  | { type: 'swap'; from: Square; to: Square }
  | { type: 'portalOut'; from: Square; to: Square }
  | { type: 'stone'; at: Square; on: boolean }
  | { type: 'howlerAbsorb'; at: Square };

export type GameState = {
  pieces: Piece[];
  capturedPieces: Piece[];
  currentTurn: Color;
  selectedSquare: Square | null;
  highlights: Highlight[];
  abilityMode: AbilityMode;
  status: GameStatus;
  lastEffect: Effect | null;
  armyConfigs?: { p1: import('@/types/army').ArmyConfig; p2: import('@/types/army').ArmyConfig };
};

export type GameAction =
  | { type: 'SELECT_SQUARE'; square: Square }
  | { type: 'MOVE_PIECE'; from: Square; to: Square }
  | { type: 'ABILITY_ACTION'; square: Square }
  | { type: 'END_TURN' }
  | { type: 'DESELECT' }
  | { type: 'RESET_GAME' }
  | { type: 'RESIGN'; resigningColor: Color };
