import { useState, useCallback, useMemo, useEffect } from 'react';
import type { GameState, Square, Color } from '@/types/game';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { hasSelfClickAbility } from '@/engine/pieceTraits';
import { writeGameState } from '@/lib/games';
import { useReplayRecorder } from '@/screens/Game/useReplayRecorder';

type Props = {
  gameId: string;
  initialState: GameState;
  remoteState: GameState | null;
  myColor: Color;
  hostTimeMs: number | null;
  guestTimeMs: number | null;
  turnStartedAt: string | null;
  isHost: boolean;
  // Read-only watcher: never my turn, taps only inspect, never writes to the DB.
  spectator?: boolean;
};

export function useOnlineGame({
  gameId, initialState, remoteState, myColor, hostTimeMs, guestTimeMs, turnStartedAt, isHost,
  spectator = false,
}: Props) {
  const [state, setState] = useState<GameState>(initialState);

  // Apply incoming remote updates (opponent moved, or game ended).
  // Diff by pieces + turn + status so resign/timeout transitions sync.
  useEffect(() => {
    if (!remoteState) return;
    const remoteKey = `${remoteState.currentTurn}|${remoteState.status.type}|${JSON.stringify(remoteState.pieces)}`;
    const localKey = `${state.currentTurn}|${state.status.type}|${JSON.stringify(state.pieces)}`;
    if (remoteKey !== localKey) {
      setState(remoteState);
    }
  }, [remoteState]);

  // A spectator never has a turn, so they never reach the write path below.
  const isMyTurn = !spectator && state.currentTurn === myColor;

  // Replay recording — driven by `state` transitions, which covers both my
  // own reducer moves and the opponent's moves arriving via remote sync
  // (each sub-move is written to the DB, so it arrives as its own frame).
  const { canReplay, replayRequest, triggerReplay } = useReplayRecorder(state);

  const onSquarePress = useCallback(
    async (square: Square) => {
      const action = classifyAction(square, state);

      // Spectator: read-only inspection of EITHER side. Selecting a piece
      // previews its moves in grey; nothing is ever written to the DB.
      if (spectator) {
        if (action.type === 'SELECT_SQUARE') {
          const piece = state.pieces.find(p => p.row === square.row && p.col === square.col);
          const inspectColor = piece ? piece.color : state.currentTurn;
          const next = gameReducer({ ...state, currentTurn: inspectColor }, action);
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

      // Compute timer update if the turn changed and timer is active
      const turnChanged = next.currentTurn !== state.currentTurn;
      const activePlayerWasHost = isHost;
      const myBank = isHost ? hostTimeMs : guestTimeMs;

      let timerUpdate: Parameters<typeof writeGameState>[2] = undefined;
      if (turnChanged && myBank !== null && turnStartedAt) {
        const elapsed = Date.now() - new Date(turnStartedAt).getTime();
        const remaining = Math.max(0, myBank - elapsed);
        timerUpdate = {
          activePlayerWasHost,
          activeBankAfterMove: remaining,
          turnChanged: true,
        };
      }

      try {
        await writeGameState(gameId, next, timerUpdate);
      } catch (err) {
        console.error('writeGameState failed', err);
      }
    },
    [state, isMyTurn, spectator, myColor, gameId, hostTimeMs, guestTimeMs, turnStartedAt, isHost],
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
    lastEffect: state.lastEffect,
    isMyTurn,
    replayRequest,
    canReplay,
    triggerReplay,
    onSquarePress,
  };
}
