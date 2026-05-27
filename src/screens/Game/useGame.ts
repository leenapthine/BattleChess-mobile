import { useReducer, useCallback, useMemo } from 'react';
import type { Piece, Square } from '@/types/game';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { createInitialState } from '@/engine/initialBoard';

const SELF_CLICK_TYPES: Piece['type'][] = [
  'NecroPawn', 'GhoulKing', 'DeadLauncher',
  'Beholder', 'BoulderThrower', 'Familiar', 'Portal',
];

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

  const selectedCanActivate = useMemo(() => {
    if (!state.selectedSquare || state.abilityMode.type !== 'none') return false;
    const piece = state.pieces.find(
      p => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    );
    return !!piece && piece.color === state.currentTurn && SELF_CLICK_TYPES.includes(piece.type);
  }, [state.selectedSquare, state.abilityMode, state.pieces, state.currentTurn]);

  return {
    pieces: state.pieces,
    capturedPieces: state.capturedPieces,
    currentTurn: state.currentTurn,
    selectedSquare: state.selectedSquare,
    selectedCanActivate,
    highlights: state.highlights,
    abilityMode: state.abilityMode,
    status: state.status,
    onSquarePress,
    onNewGame,
  };
}
