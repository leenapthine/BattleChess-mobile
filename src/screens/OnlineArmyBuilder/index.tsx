import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useState } from 'react';
import type { ArmyConfig } from '@/types/army';
import type { Color } from '@/types/game';
import { ArmyBuilderScreen } from '@/screens/ArmyBuilder';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  gameId: string;
  pointCap: number;
  isHost: boolean;
  hasSubmitted: boolean;
  opponentSubmitted: boolean;
  onSubmit: (army: ArmyConfig) => Promise<void>;
};

export function OnlineArmyBuilderScreen({
  pointCap, isHost, hasSubmitted, opponentSubmitted, onSubmit,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  if (hasSubmitted) {
    return (
      <View style={styles.waitContainer}>
        <Text style={styles.waitTitle}>ARMY SUBMITTED</Text>
        <Text style={styles.waitSubtitle}>
          {opponentSubmitted ? 'starting game...' : 'waiting for opponent...'}
        </Text>
        <ActivityIndicator size="large" color={COLORS.text} style={{ marginTop: 32 }} />
      </View>
    );
  }

  return (
    <ArmyBuilderScreen
      player={isHost ? 1 : 2}
      pointCap={pointCap}
      onConfirm={async (army) => {
        if (submitting) return;
        setSubmitting(true);
        try {
          await onSubmit(army);
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  waitContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  waitTitle: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 22,
    marginBottom: 8,
  },
  waitSubtitle: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 14,
  },
});
