import { useState, useCallback, useMemo, useEffect } from 'react';
import type { GameState, Square, Color } from '@/types/game';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { hasSelfClickAbility } from '@/engine/pieceTraits';
import { writeGameState } from '@/lib/games';

type Props = {
  gameId: string;
  initialState: GameState;
  remoteState: GameState | null;
  myColor: Color;
};

export function useOnlineGame({ gameId, initialState, remoteState, myColor }: Props) {
  const [state, setState] = useState<GameState>(initialState);

  // Apply incoming remote updates (when it's not our move)
  useEffect(() => {
    if (remoteState && JSON.stringify(remoteState.pieces) !== JSON.stringify(state.pieces)) {
      setState(remoteState);
    }
  }, [remoteState]);

  const isMyTurn = state.currentTurn === myColor;

  const onSquarePress = useCallback(
    async (square: Square) => {
      if (!isMyTurn) return;
      const action = classifyAction(square, state);
      const next = gameReducer(state, action);
      setState(next);
      try {
        await writeGameState(gameId, next);
      } catch (err) {
        console.error('writeGameState failed', err);
      }
    },
    [state, isMyTurn, gameId],
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
    isMyTurn,
    onSquarePress,
  };
}
