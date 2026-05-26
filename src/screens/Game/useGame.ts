import { useReducer, useCallback } from 'react';
import type { Square } from '@/types/game';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { createInitialState } from '@/engine/initialBoard';

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

  return {
    pieces: state.pieces,
    capturedPieces: state.capturedPieces,
    currentTurn: state.currentTurn,
    selectedSquare: state.selectedSquare,
    highlights: state.highlights,
    abilityMode: state.abilityMode,
    status: state.status,
    onSquarePress,
    onNewGame,
  };
}
