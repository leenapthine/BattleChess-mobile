import { View, Text, StyleSheet } from 'react-native';
import type { Color, GameStatus, AbilityMode } from '@/types/game';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  currentTurn: Color;
  status: GameStatus;
  abilityMode: AbilityMode;
  flashMessage: string | null;
};

const ABILITY_LABELS: Record<string, string> = {
  sacrifice: 'Click armed pawn again to detonate',
  resurrection: 'Select a square to resurrect a piece',
  loading: 'Select a pawn to load',
  launch: 'Select a target square to launch',
  boulder: 'Select an enemy to throw a boulder at',
  domination: 'Move the dominated piece',
  secondMove: 'Make your second move',
  sacrificeSelection: 'Select a friendly piece to sacrifice',
};

export function GameHeader({ currentTurn, status, abilityMode, flashMessage }: Props) {
  const turnLabel = status.type === 'won'
    ? `${status.winner} wins!`
    : `${currentTurn}'s turn`;

  const abilityLabel = flashMessage ?? ABILITY_LABELS[abilityMode.type] ?? null;

  return (
    <View style={styles.container}>
      <Text style={styles.turn}>{turnLabel}</Text>
      <Text style={styles.ability}>{abilityLabel ?? ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.headerBg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  turn: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONT.monoBold,
  },
  ability: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.mono,
    marginTop: 4,
  },
});
