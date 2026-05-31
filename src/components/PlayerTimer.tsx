import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  timeMs: number | null;       // null = no timer (∞)
  isActive: boolean;            // whether this player's clock is ticking
  turnStartedAt: string | null; // ISO timestamp of when current turn began
  label: string;                // 'WHITE' / 'BLACK'
  onTimeout?: () => void;       // called once when displayedMs hits 0
};

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

export function PlayerTimer({ timeMs, isActive, turnStartedAt, label, onTimeout }: Props) {
  const [now, setNow] = useState(Date.now());
  const firedTimeout = useRef(false);

  useEffect(() => {
    if (!isActive || timeMs === null) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isActive, timeMs]);

  // Reset the once-fired flag when active state changes
  useEffect(() => {
    firedTimeout.current = false;
  }, [isActive, timeMs, turnStartedAt]);

  let remaining: number | null = timeMs;
  if (timeMs !== null && isActive && turnStartedAt) {
    const elapsed = now - new Date(turnStartedAt).getTime();
    remaining = Math.max(0, timeMs - elapsed);
  }

  useEffect(() => {
    if (remaining === 0 && isActive && onTimeout && !firedTimeout.current) {
      firedTimeout.current = true;
      onTimeout();
    }
  }, [remaining, isActive, onTimeout]);

  if (timeMs === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.infinity}>∞</Text>
      </View>
    );
  }

  const safeRemaining = remaining ?? timeMs;
  const low = safeRemaining < 10_000;

  return (
    <View style={[styles.container, isActive && styles.containerActive]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.time, low && styles.timeLow]}>{format(safeRemaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 4,
    minWidth: 64,
  },
  containerActive: {
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 9,
  },
  time: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 16,
  },
  timeLow: {
    color: '#ff3333',
  },
  infinity: {
    color: COLORS.textMuted,
    fontFamily: FONT.monoBold,
    fontSize: 18,
  },
});
