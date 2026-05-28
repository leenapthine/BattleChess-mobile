import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  pointCap: number;
  hostName: string;
  onCancel: () => void;
};

export function WaitingRoomScreen({ pointCap, hostName, onCancel }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WAITING FOR OPPONENT</Text>
      <Text style={styles.subtitle}>{hostName} • {pointCap} pts</Text>
      <ActivityIndicator size="large" color={COLORS.text} style={{ marginVertical: 32 }} />
      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>CANCEL</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 22,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 14,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 4,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontFamily: FONT.monoBold,
    fontSize: 14,
  },
});
