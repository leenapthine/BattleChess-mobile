import type { ArmyConfig } from '@/types/army';
import type { PieceType } from '@/types/game';
import { UPGRADE_COSTS, GUILD_PIECES } from '@/data/upgradeCosts';

export function calculatePointsSpent(army: ArmyConfig): number {
  return army.slots.reduce((sum, slot) => {
    if (!slot.upgraded) return sum;
    return sum + UPGRADE_COSTS[army.guild][slot.role];
  }, 0);
}

export function toggleSlotAt(
  army: ArmyConfig,
  index: number,
  pointCap: number,
): ArmyConfig {
  const slot = army.slots[index];
  const cost = UPGRADE_COSTS[army.guild][slot.role];
  const pointsSpent = calculatePointsSpent(army);
  if (!slot.upgraded && pointCap - pointsSpent < cost) return army;
  const newSlots = [...army.slots];
  newSlots[index] = { ...slot, upgraded: !slot.upgraded };
  return { ...army, slots: newSlots };
}

export function upgradeAllSlots(army: ArmyConfig, pointCap: number): ArmyConfig {
  let remaining = pointCap;
  const newSlots = army.slots.map(slot => {
    const cost = UPGRADE_COSTS[army.guild][slot.role];
    if (remaining >= cost) {
      remaining -= cost;
      return { ...slot, upgraded: true };
    }
    return { ...slot, upgraded: false };
  });
  return { ...army, slots: newSlots };
}

export function clearAllSlots(army: ArmyConfig): ArmyConfig {
  return {
    ...army,
    slots: army.slots.map(s => ({ ...s, upgraded: false })),
  };
}

export function getSlotPieceType(army: ArmyConfig, index: number): PieceType {
  const slot = army.slots[index];
  return slot.upgraded ? GUILD_PIECES[army.guild][slot.role] : slot.role;
}

export function getSlotCost(army: ArmyConfig, index: number): number {
  const slot = army.slots[index];
  return UPGRADE_COSTS[army.guild][slot.role];
}

export function canAffordSlot(army: ArmyConfig, index: number, pointCap: number): boolean {
  const slot = army.slots[index];
  if (slot.upgraded) return true;
  const pointsSpent = calculatePointsSpent(army);
  return pointCap - pointsSpent >= UPGRADE_COSTS[army.guild][slot.role];
}
