import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Color, GameStatus, AbilityMode } from '@/types/game';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  currentTurn: Color;
  status: GameStatus;
  abilityMode: AbilityMode;
  flashMessage: string | null;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
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

/**
 * Full-width turn bar: the clocks (passed as leftSlot/rightSlot) flank the
 * centered turn label, and the ability/status line spans edge-to-edge below
 * — clamped to one line so a long name/label can never wrap and shift the
 * board.
 */
export function GameHeader({ currentTurn, status, abilityMode, flashMessage, leftSlot, rightSlot }: Props) {
  const turnLabel = status.type === 'won'
    ? `${status.winner} wins!`
    : `${currentTurn}'s turn`;

  const abilityLabel = flashMessage ?? ABILITY_LABELS[abilityMode.type] ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.turnRow}>
        <View style={styles.slot}>{leftSlot}</View>
        <Text style={styles.turn}>{turnLabel}</Text>
        <View style={styles.slot}>{rightSlot}</View>
      </View>
      <Text style={styles.ability} numberOfLines={1} ellipsizeMode="tail">
        {abilityLabel ?? ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.headerBg,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    // holds a clock at each end; sizes to the clock's content
  },
  turn: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONT.monoBold,
  },
  ability: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.mono,
    marginTop: 4,
  },
});
