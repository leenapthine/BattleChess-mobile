import type { Piece, Highlight, PieceType, GameState } from '@/types/game';
import type { GainedAbilities } from '@/types/game';
import {
  getBishopMoves,
  getKnightMoves,
  getRookMoves,
  getQueenMoves,
} from '@/engine/helpers/moveHelpers';
import { getValidMoves as getPawnMoves } from './Pawn';
import { getPieceAt, removePiece, updatePiece } from '@/engine/utils';

const KNIGHT_TYPES: PieceType[] = ['Knight', 'BeastKnight', 'GhostKnight', 'Prowler', 'Familiar'];
const ROOK_TYPES: PieceType[] = ['Rook', 'Beholder', 'BoulderThrower', 'DeadLauncher', 'Portal'];
const QUEEN_TYPES: PieceType[] = ['Queen', 'QueenOfIllusions', 'QueenOfDomination', 'QueenOfBones', 'QueenOfDestruction'];
const PAWN_TYPES: PieceType[] = ['Pawn', 'NecroPawn', 'YoungWiz', 'PawnHopper', 'HellPawn'];

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights = getBishopMoves(piece, pieces);

  if (piece.gainedAbilities.knight) {
    highlights.push(...getKnightMoves(piece, pieces));
  }
  if (piece.gainedAbilities.rook) {
    highlights.push(...getRookMoves(piece, pieces));
  }
  if (piece.gainedAbilities.queen) {
    highlights.push(...getQueenMoves(piece, pieces));
  }
  if (piece.gainedAbilities.pawn) {
    highlights.push(...getPawnMoves(piece, pieces));
  }

  return deduplicateHighlights(highlights);
}

export function getAbilityGain(capturedType: PieceType): keyof GainedAbilities | null {
  if (KNIGHT_TYPES.includes(capturedType)) return 'knight';
  if (ROOK_TYPES.includes(capturedType)) return 'rook';
  if (QUEEN_TYPES.includes(capturedType)) return 'queen';
  if (PAWN_TYPES.includes(capturedType)) return 'pawn';
  return null;
}

export function performCapture(
  howler: Piece,
  targetSquare: { row: number; col: number },
  state: GameState,
): GameState {
  const target = getPieceAt(targetSquare, state.pieces);
  if (!target || target.color === howler.color || target.isStone) return state;

  let updatedPieces = removePiece(state.pieces, target.id);

  const abilityKey = getAbilityGain(target.type);
  const newAbilities = abilityKey
    ? { ...howler.gainedAbilities, [abilityKey]: true }
    : howler.gainedAbilities;

  updatedPieces = updatePiece(updatedPieces, howler.id, {
    row: targetSquare.row,
    col: targetSquare.col,
    hasMoved: true,
    gainedAbilities: newAbilities,
  });

  return {
    ...state,
    pieces: updatedPieces,
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
    currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
  };
}

function deduplicateHighlights(highlights: Highlight[]): Highlight[] {
  const seen = new Set<string>();
  return highlights.filter(h => {
    const key = `${h.row},${h.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
