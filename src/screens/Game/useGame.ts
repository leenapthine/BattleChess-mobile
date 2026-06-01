import { useReducer, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { Color, Square } from '@/types/game';
import type { ArmyConfig } from '@/types/army';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { createInitialState } from '@/engine/initialBoard';
import { hasSelfClickAbility } from '@/engine/pieceTraits';

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

  const onNewGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    setWhiteTimeMs(initialBankMs);
    setBlackTimeMs(initialBankMs);
    setTurnStartedAt(new Date().toISOString());
    prevTurnRef.current = 'White';
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
    onSquarePress,
    onNewGame,
    onResign,
    onTimeout,
  };
}
