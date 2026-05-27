import type { PieceType, Color } from '@/types/game';

export const SELF_CLICK_TYPES: PieceType[] = [
  'NecroPawn', 'GhoulKing', 'DeadLauncher',
  'Beholder', 'BoulderThrower', 'Familiar', 'Portal', 'WizardKing',
];

export function hasSelfClickAbility(type: PieceType): boolean {
  return SELF_CLICK_TYPES.includes(type);
}

export function opponentColor(color: Color): Color {
  return color === 'White' ? 'Black' : 'White';
}
