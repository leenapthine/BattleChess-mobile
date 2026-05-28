import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  player: 1 | 2;
  pointsRemaining: number;
  pointCap: number;
};

export function ArmyBuilderHeader({ player, pointsRemaining, pointCap }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PLAYER {player} — ARMY SETUP</Text>
      <Text style={[styles.points, pointsRemaining < 0 && styles.overBudget]}>
        Points: {pointsRemaining} / {pointCap}
      </Text>
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
  title: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 18,
  },
  points: {
    color: '#ffffff',
    fontFamily: FONT.mono,
    fontSize: 14,
    marginTop: 4,
  },
  overBudget: {
    color: '#ff3333',
  },
});
