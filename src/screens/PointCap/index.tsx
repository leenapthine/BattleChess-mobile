import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  onStart: (pointCap: number) => void;
};

export function PointCapScreen({ onStart }: Props) {
  const [value, setValue] = useState('100');

  const points = parseInt(value, 10) || 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>BATTLECHESS</Text>
      <Text style={styles.subtitle}>SET POINT CAP</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          maxLength={4}
          selectTextOnFocus
        />
        <Text style={styles.pts}>pts</Text>
      </View>
      <Pressable
        style={[styles.button, points <= 0 && styles.buttonDisabled]}
        onPress={() => points > 0 && onStart(points)}
        disabled={points <= 0}
      >
        <Text style={styles.buttonText}>START</Text>
      </Pressable>
    </KeyboardAvoidingView>
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
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 16,
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  input: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 48,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    textAlign: 'center',
    width: 160,
    paddingVertical: 8,
  },
  pts: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 20,
    marginLeft: 12,
  },
  button: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: '#000000',
    fontFamily: FONT.monoBold,
    fontSize: 20,
  },
});
