import type { GameState, GameAction } from '@/types/game';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_SQUARE':
      return state;

    case 'MOVE_PIECE':
      return state;

    case 'ABILITY_ACTION':
      return state;

    case 'END_TURN':
      return {
        ...state,
        currentTurn: state.currentTurn === 'White' ? 'Black' : 'White',
        selectedSquare: null,
        highlights: [],
        abilityMode: { type: 'none' },
      };

    case 'DESELECT':
      return {
        ...state,
        selectedSquare: null,
        highlights: [],
        abilityMode: { type: 'none' },
      };

    default:
      return state;
  }
}
