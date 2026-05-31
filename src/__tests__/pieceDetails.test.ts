import { pieceDetails } from '@/data/pieceDetails';
import type { PieceType } from '@/types/game';

const ALL_PIECE_TYPES: PieceType[] = [
  'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King',
  'NecroPawn', 'GhostKnight', 'Necromancer', 'DeadLauncher', 'GhoulKing', 'QueenOfBones',
  'HellPawn', 'Prowler', 'Howler', 'Beholder', 'HellKing', 'QueenOfDestruction',
  'PawnHopper', 'BeastKnight', 'BeastDruid', 'BoulderThrower', 'FrogKing', 'QueenOfDomination',
  'YoungWiz', 'Familiar', 'WizardTower', 'Portal', 'WizardKing', 'QueenOfIllusions',
];

describe('pieceDetails', () => {
  it('has an entry for every PieceType', () => {
    for (const type of ALL_PIECE_TYPES) {
      expect(pieceDetails[type]).toBeDefined();
    }
  });

  it('every entry has at least one bullet', () => {
    for (const type of ALL_PIECE_TYPES) {
      expect(pieceDetails[type].length).toBeGreaterThan(0);
    }
  });

  it('every bullet is a non-empty string', () => {
    for (const type of ALL_PIECE_TYPES) {
      for (const bullet of pieceDetails[type]) {
        expect(typeof bullet).toBe('string');
        expect(bullet.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
