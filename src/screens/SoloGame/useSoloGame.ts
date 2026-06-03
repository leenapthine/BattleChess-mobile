import { useReducer, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Color, Square } from '@/types/game';
import type { ArmyConfig } from '@/types/army';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { createInitialState } from '@/engine/initialBoard';
import { hasSelfClickAbility } from '@/engine/pieceTraits';
import { chooseTurn, type Difficulty } from '@/ai/chooseTurn';
import { useReplayRecorder } from '@/screens/Game/useReplayRecorder';

type Props = {
  humanArmy: ArmyConfig; // White, bottom of board
  aiArmy: ArmyConfig;    // Black, top of board
  difficulty: Difficulty;
};

const AI_COLOR: Color = 'Black';
const THINK_DELAY_MS = 350; // let the human's move settle + show "thinking…"
const STEP_MS = 450;        // gap between the AI's sub-moves so each animates

export function useSoloGame({ humanArmy, aiArmy, difficulty }: Props) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { humanArmy, aiArmy },
    (a) => createInitialState(a.humanArmy, a.aiArmy),
  );

  const [thinking, setThinking] = useState(false);
  const aiBusy = useRef(false);

  // Drive the AI whenever it's its turn. chooseTurn computes the whole turn as
  // a deterministic tap-sequence; we dispatch the taps one at a time so each
  // sub-move plays its animation/SFX, exactly as if a human tapped them.
  useEffect(() => {
    if (state.currentTurn !== AI_COLOR || state.status.type !== 'active') return;
    if (aiBusy.current) return;
    aiBusy.current = true;
    setThinking(true);

    const think = setTimeout(() => {
      const actions = chooseTurn(state, difficulty);
      if (!actions) {
        dispatch({ type: 'RESIGN', resigningColor: AI_COLOR });
        aiBusy.current = false;
        setThinking(false);
        return;
      }
      let i = 0;
      const step = () => {
        dispatch(actions[i]);
        i += 1;
        if (i < actions.length) {
          setTimeout(step, STEP_MS);
        } else {
          aiBusy.current = false;
          setThinking(false);
        }
      };
      step();
    }, THINK_DELAY_MS);

    return () => clearTimeout(think);
  }, [state, difficulty]);

  // The human only controls White, and only on White's turn.
  const onSquarePress = useCallback(
    (square: Square) => {
      if (state.currentTurn !== 'White' || state.status.type !== 'active') return;
      dispatch(classifyAction(square, state));
    },
    [state],
  );

  const { canReplay, replayRequest, triggerReplay, resetReplay } = useReplayRecorder(state);

  const onNewGame = useCallback(() => {
    aiBusy.current = false;
    setThinking(false);
    dispatch({ type: 'RESET_GAME' });
    resetReplay();
  }, [resetReplay]);

  const onResign = useCallback(() => {
    dispatch({ type: 'RESIGN', resigningColor: 'White' });
  }, []);

  const selectedPiece = useMemo(() => {
    if (!state.selectedSquare) return null;
    return state.pieces.find(
      (p) => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    ) ?? null;
  }, [state.selectedSquare, state.pieces]);

  const selectedCanActivate = useMemo(() => {
    if (!state.selectedSquare || state.abilityMode.type !== 'none') return false;
    const piece = state.pieces.find(
      (p) => p.row === state.selectedSquare!.row && p.col === state.selectedSquare!.col,
    );
    return !!piece && piece.color === state.currentTurn && hasSelfClickAbility(piece.type);
  }, [state.selectedSquare, state.abilityMode, state.pieces, state.currentTurn]);

  return {
    pieces: state.pieces,
    currentTurn: state.currentTurn,
    selectedSquare: state.selectedSquare,
    selectedPiece,
    selectedCanActivate,
    highlights: state.highlights,
    abilityMode: state.abilityMode,
    status: state.status,
    lastEffect: state.lastEffect,
    flashMessage: thinking ? 'opponent is thinking…' : null,
    replayRequest,
    canReplay,
    triggerReplay,
    onSquarePress,
    onNewGame,
    onResign,
  };
}
