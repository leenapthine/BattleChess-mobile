import { useReducer, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { Square } from '@/types/game';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { createInitialState } from '@/engine/initialBoard';
import { hasSelfClickAbility } from '@/engine/pieceTraits';

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  const onSquarePress = useCallback(
    (square: Square) => {
      const action = classifyAction(square, state);
      dispatch(action);
    },
    [state],
  );

  const onNewGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

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
    flashMessage,
    onSquarePress,
    onNewGame,
  };
}
