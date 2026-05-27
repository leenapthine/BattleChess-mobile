import type { GameState, Square, Piece } from '@/types/game';
import { getPieceAt, squaresEqual, updatePiece, generateId } from '@/engine/utils';
import { getPieceModule } from '@/engine/pieces/index';
import { handleCapture, checkWinCondition, checkQoBRevival } from './captureHandler';
import { switchTurn } from './turnManager';
import { performSacrifice } from '@/engine/pieces/NecroPawn';
import { getAbilityTargets as getGhoulKingTargets } from '@/engine/pieces/GhoulKing';
import { toggleStone } from '@/engine/pieces/Familiar';
import { getLoadTargets as getDLLoadTargets, getLaunchTargets } from '@/engine/pieces/DeadLauncher';
import { getAbilityTargets as getBeholderTargets } from '@/engine/pieces/Beholder';
import { getAbilityTargets as getBoulderTargets } from '@/engine/pieces/BoulderThrower';
import { getLoadTargets as getPortalLoadTargets, getEjectTargets, performLoad, performEject } from '@/engine/pieces/Portal';
import { performSecondMove } from '@/engine/pieces/Prowler';

export function handleSelfClickAbility(state: GameState, square: Square): GameState {
  const piece = getPieceAt(square, state.pieces);
  if (!piece || piece.color !== state.currentTurn) return state;

  switch (piece.type) {
    case 'NecroPawn': {
      const mod = getPieceModule('NecroPawn')!;
      const targets = mod.getAbilityTargets!(piece, state.pieces);
      return {
        ...state,
        highlights: targets,
        abilityMode: { type: 'sacrifice', pieceId: piece.id, armed: true },
      };
    }
    case 'GhoulKing': {
      const targets = getGhoulKingTargets(piece, state.pieces);
      if (targets.length === 0) return state;
      return { ...state, highlights: targets };
    }
    case 'Familiar':
      return checkWinCondition(toggleStone(piece, state));
    case 'DeadLauncher': {
      if (!piece.pawnLoaded) {
        return {
          ...state,
          highlights: getDLLoadTargets(piece, state.pieces),
          abilityMode: { type: 'loading', pieceId: piece.id },
        };
      }
      return {
        ...state,
        highlights: getLaunchTargets(piece, state.pieces),
        abilityMode: { type: 'launch', pieceId: piece.id },
      };
    }
    case 'Beholder':
      return {
        ...state,
        highlights: getBeholderTargets(piece, state.pieces),
        abilityMode: { type: 'boulder', pieceId: piece.id },
      };
    case 'BoulderThrower':
      return {
        ...state,
        highlights: getBoulderTargets(piece, state.pieces),
        abilityMode: { type: 'boulder', pieceId: piece.id },
      };
    case 'Portal': {
      if (!piece.pieceLoaded) {
        return {
          ...state,
          highlights: getPortalLoadTargets(piece, state.pieces),
          abilityMode: { type: 'loading', pieceId: piece.id },
        };
      }
      return {
        ...state,
        highlights: getEjectTargets(piece, state.pieces),
        abilityMode: { type: 'launch', pieceId: piece.id },
      };
    }
    default:
      return state;
  }
}

export function handleSacrificeAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'sacrifice') return state;
  const { pieceId } = state.abilityMode;
  const piece = state.pieces.find(p => p.id === pieceId);
  if (!piece) return state;

  if (squaresEqual(square, { row: piece.row, col: piece.col })) {
    const sacrificeResult = performSacrifice(piece, state);
    const killed = state.pieces.filter(p => !sacrificeResult.pieces.find(sp => sp.id === p.id));
    const deadQoB = killed.find(p => p.type === 'QueenOfBones');
    if (deadQoB) {
      const revivalState = { ...sacrificeResult, currentTurn: state.currentTurn };
      const revival = checkQoBRevival(deadQoB, revivalState, null);
      if (revival) return revival;
    }
    return checkWinCondition(sacrificeResult);
  }

  return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
}

export function handleResurrectionAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'resurrection') return state;
  const { color, targets } = state.abilityMode;

  const isValid = targets.some(t => squaresEqual(t, square));
  if (!isValid) return { ...state, abilityMode: { type: 'none' }, highlights: [] };

  const newPawn: Piece = {
    id: generateId(),
    type: 'Pawn',
    color,
    row: square.row,
    col: square.col,
    hasMoved: false,
    stunned: false,
    isStone: false,
    pawnLoaded: false,
    pieceLoaded: null,
    raisesLeft: 0,
    gainedAbilities: { knight: false, rook: false, queen: false, pawn: false },
  };

  return checkWinCondition(switchTurn({
    ...state,
    pieces: [...state.pieces, newPawn],
    selectedSquare: null,
    highlights: [],
    abilityMode: { type: 'none' },
  }));
}

export function handleLoadingAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'loading') return state;
  const { pieceId } = state.abilityMode;
  const loader = state.pieces.find(p => p.id === pieceId);
  if (!loader) return state;

  const isValidTarget = state.highlights.some(
    h => h.row === square.row && h.col === square.col,
  );
  if (!isValidTarget) {
    return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
  }

  const target = getPieceAt(square, state.pieces);
  if (!target || target.color !== loader.color) {
    return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
  }

  if (loader.type === 'DeadLauncher') {
    const updated = updatePiece(state.pieces, loader.id, { pawnLoaded: true });
    const removed = updated.filter(p => p.id !== target.id);
    return checkWinCondition(switchTurn({
      ...state, pieces: removed, selectedSquare: null, highlights: [], abilityMode: { type: 'none' },
    }));
  }

  if (loader.type === 'Portal') {
    return checkWinCondition(performLoad(loader, target.id, state));
  }

  return state;
}

export function handleLaunchAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'launch') return state;
  const { pieceId } = state.abilityMode;
  const launcher = state.pieces.find(p => p.id === pieceId);
  if (!launcher) return state;

  if (launcher.type === 'DeadLauncher') {
    const target = getPieceAt(square, state.pieces);
    if (!target || target.color === launcher.color || target.isStone) {
      return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
    }
    const result = handleCapture(target, launcher, state);
    const updated = updatePiece(result.state.pieces, launcher.id, { pawnLoaded: false });
    const afterLaunch = {
      ...result.state, pieces: updated, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } as const,
    };
    const revival = checkQoBRevival(target, afterLaunch, null);
    if (revival) return revival;
    return checkWinCondition(switchTurn(afterLaunch));
  }

  if (launcher.type === 'Portal') {
    return performEject(launcher, square, state);
  }

  return state;
}

export function handleBoulderAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'boulder') return state;
  const { pieceId } = state.abilityMode;
  const thrower = state.pieces.find(p => p.id === pieceId);
  const target = getPieceAt(square, state.pieces);

  if (!target || target.isStone || !thrower || target.color === thrower.color) {
    return { ...state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } };
  }

  const result = handleCapture(target, thrower, state);
  const afterBoulder = {
    ...result.state, selectedSquare: null, highlights: [], abilityMode: { type: 'none' } as const,
  };
  const revival = checkQoBRevival(target, afterBoulder, null);
  if (revival) return revival;
  return checkWinCondition(switchTurn(afterBoulder));
}

export function handleSecondMoveAbility(state: GameState, square: Square): GameState {
  if (state.abilityMode.type !== 'secondMove') return state;
  const { pieceId } = state.abilityMode;
  const prowler = state.pieces.find(p => p.id === pieceId);
  if (!prowler) return state;

  const highlight = state.highlights.find(h => h.row === square.row && h.col === square.col);
  if (!highlight) {
    return state;
  }

  return checkWinCondition(performSecondMove(prowler, square, state));
}
