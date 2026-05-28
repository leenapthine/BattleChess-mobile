export type Guild = 'Necro' | 'Demon' | 'Beast' | 'Wizard';

export type BasicRole = 'Pawn' | 'Knight' | 'Bishop' | 'Rook' | 'Queen' | 'King';

export type SlotConfig = {
  role: BasicRole;
  upgraded: boolean;
};

export type ArmyConfig = {
  guild: Guild;
  slots: SlotConfig[];
};

export const BOARD_SLOTS: BasicRole[] = [
  'Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Bishop', 'Knight', 'Rook',
  'Pawn', 'Pawn', 'Pawn', 'Pawn', 'Pawn', 'Pawn', 'Pawn', 'Pawn',
];

export function createDefaultArmy(guild: Guild): ArmyConfig {
  return {
    guild,
    slots: BOARD_SLOTS.map(role => ({ role, upgraded: false })),
  };
}
