import { useCallback, useEffect, useRef, useState } from 'react';
import type { Piece, Effect, Color, GameStatus } from '@/types/game';

export type ReplayStep = { pieces: Piece[]; effect: Effect | null };
export type ReplayRequest = { before: Piece[]; steps: ReplayStep[]; nonce: number };

type RecorderState = {
  pieces: Piece[];
  currentTurn: Color;
  lastEffect: Effect | null;
  status: GameStatus;
};

// True if the two boards differ in piece set or any piece position — used to
// record a frame only on real moves, not selections.
function boardsDiffer(a: Piece[], b: Piece[]): boolean {
  if (a.length !== b.length) return true;
  const map = new Map(a.map((p) => [p.id, p]));
  return b.some((p) => {
    const o = map.get(p.id);
    return !o || o.row !== p.row || o.col !== p.col;
  });
}

/**
 * Records each turn as a sequence of board frames (one per piece-changing
 * sub-move) so a whole turn can be replayed. Driven purely by `state`
 * transitions, so it works the same for local reducer moves and for online
 * moves applied via remote state sync. A turn is finalized when it ends (the
 * turn switches, or a move wins the game).
 *
 * Shared by useGame (local) and useOnlineGame.
 */
export function useReplayRecorder(state: RecorderState) {
  const skipRef = useRef(false);
  const prevPiecesRef = useRef<Piece[]>(state.pieces);
  const prevTurnRef = useRef<Color>(state.currentTurn);
  const turnStartRef = useRef<Piece[]>(state.pieces);
  const turnStepsRef = useRef<ReplayStep[]>([]);
  const lastReplayRef = useRef<{ before: Piece[]; steps: ReplayStep[] } | null>(null);
  const [canReplay, setCanReplay] = useState(false);
  const [replayRequest, setReplayRequest] = useState<ReplayRequest | null>(null);

  useEffect(() => {
    if (skipRef.current) {
      // A reset just happened — resync to the fresh board, record nothing.
      skipRef.current = false;
      turnStartRef.current = state.pieces;
      turnStepsRef.current = [];
      prevPiecesRef.current = state.pieces;
      prevTurnRef.current = state.currentTurn;
      return;
    }

    const piecesChanged =
      prevPiecesRef.current !== state.pieces &&
      boardsDiffer(prevPiecesRef.current, state.pieces);
    const turnChanged = prevTurnRef.current !== state.currentTurn;
    const gameEnded = state.status.type === 'won';

    if (piecesChanged) {
      turnStepsRef.current = [
        ...turnStepsRef.current,
        { pieces: state.pieces, effect: state.lastEffect },
      ];
    }

    if ((turnChanged || gameEnded) && turnStepsRef.current.length > 0) {
      lastReplayRef.current = { before: turnStartRef.current, steps: turnStepsRef.current };
      setCanReplay(true);
      turnStartRef.current = state.pieces;
      turnStepsRef.current = [];
    }

    prevPiecesRef.current = state.pieces;
    prevTurnRef.current = state.currentTurn;
  }, [state.pieces, state.currentTurn, state.lastEffect, state.status.type]);

  const triggerReplay = useCallback(() => {
    const data = lastReplayRef.current;
    if (!data) return;
    setReplayRequest({ before: data.before, steps: data.steps, nonce: Date.now() });
  }, []);

  const resetReplay = useCallback(() => {
    lastReplayRef.current = null;
    turnStepsRef.current = [];
    skipRef.current = true;
    setCanReplay(false);
    setReplayRequest(null);
  }, []);

  return { canReplay, replayRequest, triggerReplay, resetReplay };
}
