import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Color } from '@/types/game';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  spectator: boolean;
  myColor: Color;
  opponentName: string;
  hostName?: string;
  guestName?: string;
  viewerCount: number;
  onShowViewers: () => void;
};

/**
 * The row above the board on the online screen: the matchup (a player's own
 * color vs the opponent, or both names for a spectator) and a tappable live
 * viewer count that opens the ViewerListModal.
 */
export function OnlineMatchupBar({
  spectator, myColor, opponentName, hostName, guestName, viewerCount, onShowViewers,
}: Props) {
  return (
    <View style={styles.row}>
      {spectator ? (
        <Text style={styles.matchup}>{hostName} (W) vs {guestName ?? '?'} (B)</Text>
      ) : (
        <Text style={styles.matchup}>YOU: {myColor}  vs {opponentName}</Text>
      )}
      {viewerCount > 0 && (
        <Pressable onPress={onShowViewers} hitSlop={8}>
          <Text style={styles.viewers}>👁 {viewerCount}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  matchup: { color: COLORS.text, fontFamily: FONT.monoBold, fontSize: 11 },
  viewers: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 11 },
});
