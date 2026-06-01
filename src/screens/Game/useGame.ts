import { useReducer, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { Color, Square, Piece, Effect } from '@/types/game';
import type { ArmyConfig } from '@/types/army';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { createInitialState } from '@/engine/initialBoard';
import { hasSelfClickAbility } from '@/engine/pieceTraits';

// True if the two boards differ in piece set or any piece position — used to
// record a replayable snapshot only on real moves, not selections.
function boardsDiffer(a: Piece[], b: Piece[]): boolean {
  if (a.length !== b.length) return true;
  const map = new Map(a.map((p) => [p.id, p]));
  return b.some((p) => {
    const o = map.get(p.id);
    return !o || o.row !== p.row || o.col !== p.col;
  });
}

type Props = {
  p1Army: ArmyConfig;
  p2Army: ArmyConfig;
  timePerTurnSeconds: number | null; // null = no timer (∞)
};

export function useGame({ p1Army, p2Army, timePerTurnSeconds }: Props) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { p1Army, p2Army },
    (args) => createInitialState(args.p1Army, args.p2Army),
  );

  // Per-player time banks (null = unlimited). Reset when the game resets or
  // the timer setting changes.
  const initialBankMs = timePerTurnSeconds === null ? null : timePerTurnSeconds * 1000;
  const [whiteTimeMs, setWhiteTimeMs] = useState<number | null>(initialBankMs);
  const [blackTimeMs, setBlackTimeMs] = useState<number | null>(initialBankMs);
  const [turnStartedAt, setTurnStartedAt] = useState<string>(() => new Date().toISOString());
  const prevTurnRef = useRef<Color>(state.currentTurn);

  // When the turn changes, deduct elapsed time from the player who just moved
  // and reset the turn-started timestamp for the next player.
  useEffect(() => {
    if (state.currentTurn === prevTurnRef.current) return;
    const justMoved = prevTurnRef.current;
    const elapsed = Date.now() - new Date(turnStartedAt).getTime();
    if (justMoved === 'White') {
      setWhiteTimeMs((curr) => (curr === null ? null : Math.max(0, curr - elapsed)));
    } else {
      setBlackTimeMs((curr) => (curr === null ? null : Math.max(0, curr - elapsed)));
    }
    setTurnStartedAt(new Date().toISOString());
    prevTurnRef.current = state.currentTurn;
  }, [state.currentTurn, turnStartedAt]);

  const onSquarePress = useCallback(
    (square: Square) => {
      const action = classifyAction(square, state);
      dispatch(action);
    },
    [state],
  );

  // Replay support: record each player's turn as a sequence of board frames
  // (one per piece-changing sub-move) so multi-step turns — Prowler
  // double-move, Necromancer capture-then-raise, GhoulKing raise-then-move,
  // QueenOfDomination dominate-then-move — replay in full, not just the final
  // sub-move. A turn is finalized when it ends (turn switches or game won).
  type ReplayStep = { pieces: Piece[]; effect: Effect | null };
  const replaySkipRef = useRef(false);
  const replayPrevPiecesRef = useRef<Piece[]>(state.pieces);
  const replayPrevTurnRef = useRef<Color>(state.currentTurn);
  const turnStartRef = useRef<Piece[]>(state.pieces);
  const turnStepsRef = useRef<ReplayStep[]>([]);
  const lastReplayRef = useRef<{ before: Piece[]; steps: ReplayStep[] } | null>(null);
  const [canReplay, setCanReplay] = useState(false);
  const [replayRequest, setReplayRequest] = useState<
    { before: Piece[]; steps: ReplayStep[]; nonce: number } | null
  >(null);

  useEffect(() => {
    if (replaySkipRef.current) {
      // A reset just happened — resync to the fresh board, record nothing.
      replaySkipRef.current = false;
      turnStartRef.current = state.pieces;
      turnStepsRef.current = [];
      replayPrevPiecesRef.current = state.pieces;
      replayPrevTurnRef.current = state.currentTurn;
      return;
    }

    const piecesChanged =
      replayPrevPiecesRef.current !== state.pieces &&
      boardsDiffer(replayPrevPiecesRef.current, state.pieces);
    const turnChanged = replayPrevTurnRef.current !== state.currentTurn;
    const gameEnded = state.status.type === 'won';

    if (piecesChanged) {
      turnStepsRef.current = [
        ...turnStepsRef.current,
        { pieces: state.pieces, effect: state.lastEffect },
      ];
    }

    // Turn complete (opponent's turn begins, or a move just ended the game) →
    // promote the accumulated sub-moves to the replayable turn.
    if ((turnChanged || gameEnded) && turnStepsRef.current.length > 0) {
      lastReplayRef.current = { before: turnStartRef.current, steps: turnStepsRef.current };
      setCanReplay(true);
      turnStartRef.current = state.pieces;
      turnStepsRef.current = [];
    }

    replayPrevPiecesRef.current = state.pieces;
    replayPrevTurnRef.current = state.currentTurn;
  }, [state.pieces, state.currentTurn, state.lastEffect, state.status.type]);

  const triggerReplay = useCallback(() => {
    const data = lastReplayRef.current;
    if (!data) return;
    setReplayRequest({ before: data.before, steps: data.steps, nonce: Date.now() });
  }, []);

  const onNewGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    setWhiteTimeMs(initialBankMs);
    setBlackTimeMs(initialBankMs);
    setTurnStartedAt(new Date().toISOString());
    prevTurnRef.current = 'White';
    lastReplayRef.current = null;
    turnStepsRef.current = [];
    replaySkipRef.current = true;
    setCanReplay(false);
    setReplayRequest(null);
  }, [initialBankMs]);

  const onResign = useCallback(() => {
    dispatch({ type: 'RESIGN', resigningColor: state.currentTurn });
  }, [state.currentTurn]);

  const onTimeout = useCallback(
    (color: Color) => {
      if (state.status.type !== 'active') return;
      dispatch({ type: 'RESIGN', resigningColor: color });
    },
    [state.status.type],
  );

  const selectedPiece = useMemo(() => {
    if (!state.selectedSquare) return null;
    return state.pieces.find(
      p => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    ) ?? null;
  }, [state.selectedSquare, state.pieces]);

  const selectedCanActivate = useMemo(() => {
    if (!state.selectedSquare || state.abilityMode.type !== 'none') return false;
    const piece = state.pieces.find(
      p => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    );
    return !!piece && piece.color === state.currentTurn && hasSelfClickAbility(piece.type);
  }, [state.selectedSquare, state.abilityMode, state.pieces, state.currentTurn]);

  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const prevPiecesRef = useRef(state.pieces);

  useEffect(() => {
    const prev = prevPiecesRef.current;
    prevPiecesRef.current = state.pieces;
    const newStone = state.pieces.find(
      p => p.type === 'Familiar' && p.isStone && !prev.find(pp => pp.id === p.id && pp.isStone),
    );
    const unStoned = prev.find(
      p => p.type === 'Familiar' && p.isStone && state.pieces.find(sp => sp.id === p.id && !sp.isStone),
    );
    if (newStone) {
      setFlashMessage('Familiar turned to stone!');
    } else if (unStoned) {
      setFlashMessage('Familiar is no longer stone');
    } else {
      return;
    }
    const timer = setTimeout(() => setFlashMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [state.pieces]);

  return {
    pieces: state.pieces,
    capturedPieces: state.capturedPieces,
    currentTurn: state.currentTurn,
    selectedSquare: state.selectedSquare,
    selectedPiece,
    selectedCanActivate,
    highlights: state.highlights,
    abilityMode: state.abilityMode,
    status: state.status,
    lastEffect: state.lastEffect,
    flashMessage,
    whiteTimeMs,
    blackTimeMs,
    turnStartedAt,
    replayRequest,
    canReplay,
    triggerReplay,
    onSquarePress,
    onNewGame,
    onResign,
    onTimeout,
  };
}
