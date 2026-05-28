import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  onSignIn: () => Promise<void>;
};

export function SignInScreen({ onSignIn }: Props) {
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    setBusy(true);
    try {
      await onSignIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BATTLECHESS</Text>
      <Text style={styles.subtitle}>v0.7 — multiplayer beta</Text>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.buttonText}>PLAY</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>anonymous sign-in</Text>
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
    fontSize: 36,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 12,
    marginBottom: 64,
  },
  button: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 64,
    paddingVertical: 16,
    borderRadius: 4,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#000000',
    fontFamily: FONT.monoBold,
    fontSize: 20,
  },
  hint: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
    marginTop: 16,
  },
});
