import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  onContinue: () => void;
};

export function HandoffScreen({ onContinue }: Props) {
  return (
    <Pressable style={styles.container} onPress={onContinue}>
      <Text style={styles.text}>HAND DEVICE TO</Text>
      <Text style={styles.player}>PLAYER 2</Text>
      <Text style={styles.hint}>tap to continue</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 18,
  },
  player: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 36,
    marginTop: 8,
  },
  hint: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 14,
    marginTop: 32,
  },
});
