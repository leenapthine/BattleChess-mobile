import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { COLORS, FONT } from '@/constants/theme';
import type { DifficultyLevel } from '@/ai/chooseTurn';

type TimerOption = { label: string; seconds: number | null };

const TIMER_OPTIONS: TimerOption[] = [
  { label: '∞',   seconds: null },
  { label: '10m', seconds: 600 },
  { label: '20m', seconds: 1200 },
  { label: '30m', seconds: 1800 },
  { label: '45m', seconds: 2700 },
  { label: '60m', seconds: 3600 },
];

const DIFFICULTY_OPTIONS: { label: string; level: DifficultyLevel }[] = [
  { label: 'EASY',   level: 'easy' },
  { label: 'MEDIUM', level: 'medium' },
  { label: 'HARD',   level: 'hard' },
];

type Props = {
  mode: 'local' | 'online' | 'solo';
  onStart: (pointCap: number, timePerTurnSeconds: number | null, difficulty: DifficultyLevel) => void;
};

export function PointCapScreen({ mode, onStart }: Props) {
  const [value, setValue] = useState('100');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('hard');

  const points = parseInt(value, 10) || 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>BATTLECHESS</Text>

        <Text style={styles.subtitle}>POINT CAP</Text>
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

        <Text style={styles.subtitle}>TIME PER PLAYER</Text>
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map(opt => (
            <Pressable
              key={opt.label}
              style={[styles.timerBtn, timerSeconds === opt.seconds && styles.timerBtnActive]}
              onPress={() => setTimerSeconds(opt.seconds)}
            >
              <Text style={[styles.timerLabel, timerSeconds === opt.seconds && styles.timerLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'solo' && (
          <>
            <Text style={styles.subtitle}>DIFFICULTY</Text>
            <View style={styles.timerRow}>
              {DIFFICULTY_OPTIONS.map(opt => (
                <Pressable
                  key={opt.level}
                  style={[styles.timerBtn, difficulty === opt.level && styles.timerBtnActive]}
                  onPress={() => setDifficulty(opt.level)}
                >
                  <Text style={[styles.timerLabel, difficulty === opt.level && styles.timerLabelActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Pressable
          style={[styles.button, points <= 0 && styles.buttonDisabled]}
          onPress={() => points > 0 && onStart(points, timerSeconds, difficulty)}
          disabled={points <= 0}
        >
          <Text style={styles.buttonText}>START</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 32,
    marginBottom: 24,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 44,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    textAlign: 'center',
    width: 140,
    paddingVertical: 4,
  },
  pts: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 18,
    marginLeft: 12,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  timerBtn: {
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 48,
    alignItems: 'center',
  },
  timerBtnActive: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  timerLabel: {
    color: COLORS.textMuted,
    fontFamily: FONT.monoBold,
    fontSize: 14,
  },
  timerLabelActive: {
    color: '#000000',
  },
  button: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 4,
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.3 },
  buttonText: {
    color: '#000000',
    fontFamily: FONT.monoBold,
    fontSize: 18,
  },
});
