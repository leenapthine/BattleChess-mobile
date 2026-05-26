import type { Piece, Highlight } from '@/types/game';
import { getBishopMoves, getKingMoves } from '@/engine/helpers/moveHelpers';

export function getValidMoves(piece: Piece, pieces: Piece[]): Highlight[] {
  const highlights = getBishopMoves(piece, pieces);
  const kingMoves = getKingMoves(piece, pieces);

  const seen = new Set(highlights.map(h => `${h.row},${h.col}`));
  for (const m of kingMoves) {
    const key = `${m.row},${m.col}`;
    if (!seen.has(key)) {
      highlights.push(m);
      seen.add(key);
    }
  }

  return highlights;
}
