import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { ArmyConfig } from '@/types/army';
import type { Color } from '@/types/game';
import { useArmyBuilder } from './useArmyBuilder';
import { ArmyBuilderHeader } from './ArmyBuilderHeader';
import { ArmyBuilderView } from './ArmyBuilderView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { COLORS } from '@/constants/theme';

type Props = {
  player: 1 | 2;
  pointCap: number;
  onConfirm: (army: ArmyConfig) => void;
};

export function ArmyBuilderScreen({ player, pointCap, onConfirm }: Props) {
  const {
    guild, army, pointsRemaining, selectedSlot,
    changeGuild, toggleSlot, setSelectedSlot,
    upgradeAll, clearAll, getPieceType, getCost, canAfford,
    handleConfirm,
  } = useArmyBuilder({ pointCap, onConfirm });

  const playerColor: Color = player === 1 ? 'White' : 'Black';

  const slots = army.slots.map((s, i) => ({
    pieceType: getPieceType(i),
    upgraded: s.upgraded,
    cost: getCost(i),
    canAfford: canAfford(i),
  }));

  const selectedPiece = selectedSlot !== null ? {
    id: 'preview',
    type: getPieceType(selectedSlot),
    color: playerColor,
    row: 0, col: 0,
    hasMoved: false, stunned: false, isStone: false,
    pawnLoaded: false, pieceLoaded: null, raisesLeft: 0,
    gainedAbilities: { knight: false, rook: false, queen: false, pawn: false },
  } as const : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ArmyBuilderHeader
        player={player}
        pointsRemaining={pointsRemaining}
        pointCap={pointCap}
      />
      <View style={styles.cardSlot}>
        {selectedPiece && <SpriteInfoCard piece={selectedPiece} />}
      </View>
      <ArmyBuilderView
        guild={guild}
        playerColor={playerColor}
        slots={slots}
        selectedSlot={selectedSlot}
        onChangeGuild={changeGuild}
        onToggleSlot={toggleSlot}
        onSelectSlot={setSelectedSlot}
        onUpgradeAll={upgradeAll}
        onClearAll={clearAll}
        onConfirm={handleConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cardSlot: {
    height: 80,
  },
});
