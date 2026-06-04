import { useReducer, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Color, Square } from '@/types/game';
import type { ArmyConfig } from '@/types/army';
import { gameReducer } from '@/engine/gameReducer';
import { classifyAction } from '@/engine/helpers/classifyAction';
import { createInitialState } from '@/engine/initialBoard';
import { hasSelfClickAbility } from '@/engine/pieceTraits';
import { chooseTurn, type Difficulty } from '@/ai/chooseTurn';
import { humanRevivalPending, botDispatchCount } from './soloTurn';
import { useReplayRecorder } from '@/screens/Game/useReplayRecorder';

type Props = {
  whiteArmy: ArmyConfig;        // bottom of board
  blackArmy: ArmyConfig;        // top of board
  difficulty: Difficulty;
  humanColor: Color | null;     // side the human plays; null = watch (bot drives both)
};

const THINK_DELAY_MS = 350; // let the previous move settle + show "thinking…"
const STEP_MS = 450;        // gap between the bot's sub-moves so each animates

export function useSoloGame({ whiteArmy, blackArmy, difficulty, humanColor }: Props) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { whiteArmy, blackArmy },
    (a) => createInitialState(a.whiteArmy, a.blackArmy),
  );

  const [thinking, setThinking] = useState(false);
  const aiBusy = useRef(false);

  // The human must resolve their own QueenOfBones revival even when the bot
  // captured it (mid-bot-turn) — so the bot pauses for it, and the human is
  // allowed to tap during it.
  const humanRevival = humanRevivalPending(state, humanColor);

  // The bot plays every side that isn't the human's, so humanColor=null means
  // it drives both — the watch mode. It never acts while a human revival is
  // pending.
  const botToMove = !humanRevival && (humanColor === null || state.currentTurn !== humanColor);

  // Drive the bot whenever it's a bot side's turn. chooseTurn computes the whole
  // turn as a deterministic tap-sequence; we dispatch the taps one at a time so
  // each sub-move plays its animation/SFX, exactly as if a human tapped them.
  useEffect(() => {
    if (!botToMove || state.status.type !== 'active') return;
    if (aiBusy.current) return;
    aiBusy.current = true;
    setThinking(true);

    const think = setTimeout(() => {
      const actions = chooseTurn(state, difficulty);
      if (!actions) {
        dispatch({ type: 'RESIGN', resigningColor: state.currentTurn });
        aiBusy.current = false;
        setThinking(false);
        return;
      }
      // If this turn captures the human's QueenOfBones, stop right after the
      // capture so the human picks their own sacrifices (the bot's auto-resolved
      // taps are dropped). Otherwise dispatch the whole turn.
      const count = botDispatchCount(state, actions, humanColor);
      let i = 0;
      const step = () => {
        dispatch(actions[i]);
        i += 1;
        if (i < count) {
          setTimeout(step, STEP_MS);
        } else {
          aiBusy.current = false;
          setThinking(false);
        }
      };
      step();
    }, THINK_DELAY_MS);

    return () => clearTimeout(think);
  }, [state, difficulty, botToMove, humanColor]);

  // The human controls only their own color, on their turn — plus they always
  // resolve their own QueenOfBones revival (which can pop during the bot's turn).
  const onSquarePress = useCallback(
    (square: Square) => {
      if (humanColor === null) return; // watch mode: board is read-only
      if (state.status.type !== 'active') return;
      if (!humanRevival && state.currentTurn !== humanColor) return;
      dispatch(classifyAction(square, state));
    },
    [state, humanColor, humanRevival],
  );

  const { canReplay, replayRequest, triggerReplay, resetReplay } = useReplayRecorder(state);

  const onNewGame = useCallback(() => {
    aiBusy.current = false;
    setThinking(false);
    dispatch({ type: 'RESET_GAME' });
    resetReplay();
  }, [resetReplay]);

  const onResign = useCallback(() => {
    if (humanColor === null) return; // nothing to resign while watching
    dispatch({ type: 'RESIGN', resigningColor: humanColor });
  }, [humanColor]);

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
