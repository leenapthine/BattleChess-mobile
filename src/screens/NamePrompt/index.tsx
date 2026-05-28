import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  onSubmit: (name: string) => Promise<void>;
};

export function NamePromptScreen({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 20;

  const handleSubmit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>CHOOSE A NAME</Text>
      <Text style={styles.subtitle}>this is how opponents see you</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="display name"
        placeholderTextColor="#555"
        maxLength={20}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        style={[styles.button, (!valid || busy) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!valid || busy}
      >
        {busy ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.buttonText}>CONTINUE</Text>
        )}
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
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 12,
    marginBottom: 32,
  },
  input: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 22,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    textAlign: 'center',
    width: 240,
    paddingVertical: 8,
    marginBottom: 32,
  },
  button: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 4,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.3 },
  buttonText: {
    color: '#000000',
    fontFamily: FONT.monoBold,
    fontSize: 18,
  },
});
