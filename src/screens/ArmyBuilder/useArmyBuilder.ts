import { useState, useCallback, useMemo } from 'react';
import type { Guild, ArmyConfig } from '@/types/army';
import { createDefaultArmy } from '@/types/army';
import {
  calculatePointsSpent,
  toggleSlotAt,
  upgradeAllSlots,
  clearAllSlots,
  getSlotPieceType,
  getSlotCost,
  canAffordSlot,
} from './armyLogic';

type Props = {
  pointCap: number;
  onConfirm: (army: ArmyConfig) => void;
};

export function useArmyBuilder({ pointCap, onConfirm }: Props) {
  const [army, setArmy] = useState<ArmyConfig>(createDefaultArmy('Necro'));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const pointsSpent = useMemo(() => calculatePointsSpent(army), [army]);
  const pointsRemaining = pointCap - pointsSpent;

  const changeGuild = useCallback((g: Guild) => {
    setArmy(createDefaultArmy(g));
    setSelectedSlot(null);
  }, []);

  const toggleSlot = useCallback((index: number) => {
    setArmy(prev => toggleSlotAt(prev, index, pointCap));
  }, [pointCap]);

  const upgradeAll = useCallback(() => {
    setArmy(prev => upgradeAllSlots(prev, pointCap));
  }, [pointCap]);

  const clearAll = useCallback(() => {
    setArmy(prev => clearAllSlots(prev));
  }, []);

  const getPieceType = useCallback(
    (index: number) => getSlotPieceType(army, index),
    [army],
  );

  const getCost = useCallback(
    (index: number) => getSlotCost(army, index),
    [army],
  );

  const canAfford = useCallback(
    (index: number) => canAffordSlot(army, index, pointCap),
    [army, pointCap],
  );

  const handleConfirm = useCallback(() => {
    onConfirm(army);
  }, [army, onConfirm]);

  return {
    guild: army.guild,
    army,
    pointsSpent,
    pointsRemaining,
    pointCap,
    selectedSlot,
    setSelectedSlot,
    changeGuild,
    toggleSlot,
    upgradeAll,
    clearAll,
    getPieceType,
    getCost,
    canAfford,
    handleConfirm,
  };
}
