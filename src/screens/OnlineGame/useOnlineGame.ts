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

  // Apply incoming remote updates (when it's the opponent's turn that moved)
  // We diff by pieces+turn to avoid clobbering local selection state during inspection
  useEffect(() => {
    if (!remoteState) return;
    const remoteKey = `${remoteState.currentTurn}|${JSON.stringify(remoteState.pieces)}`;
    const localKey = `${state.currentTurn}|${JSON.stringify(state.pieces)}`;
    if (remoteKey !== localKey) {
      setState(remoteState);
    }
  }, [remoteState]);

  const isMyTurn = state.currentTurn === myColor;

  const onSquarePress = useCallback(
    async (square: Square) => {
      const action = classifyAction(square, state);

      // When it's not my turn, allow only inspection (select/deselect).
      // Force all highlights to 'preview' (grey) — both mine and opponent's.
      if (!isMyTurn) {
        if (action.type === 'SELECT_SQUARE') {
          const inspectionState = { ...state, currentTurn: myColor };
          const next = gameReducer(inspectionState, action);
          setState({
            ...next,
            currentTurn: state.currentTurn,
            highlights: next.highlights.map(h => ({ ...h, color: 'preview' as const })),
          });
        } else if (action.type === 'DESELECT') {
          setState(gameReducer(state, action));
        }
        return;
      }

      // My turn: apply and sync to opponent
      const next = gameReducer(state, action);
      setState(next);
      try {
        await writeGameState(gameId, next);
      } catch (err) {
        console.error('writeGameState failed', err);
      }
    },
    [state, isMyTurn, myColor, gameId],
  );

  const selectedPiece = useMemo(() => {
    if (!state.selectedSquare) return null;
    return state.pieces.find(
      p => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    ) ?? null;
  }, [state.selectedSquare, state.pieces]);

  const selectedCanActivate = useMemo(() => {
    if (!isMyTurn) return false;
    if (!state.selectedSquare || state.abilityMode.type !== 'none') return false;
    const piece = state.pieces.find(
      p => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    );
    return !!piece && piece.color === state.currentTurn && hasSelfClickAbility(piece.type);
  }, [isMyTurn, state.selectedSquare, state.abilityMode, state.pieces, state.currentTurn]);

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
