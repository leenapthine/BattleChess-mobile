import type { ReactNode } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Piece, Color, GameStatus, AbilityMode } from '@/types/game';
import { GameHeader } from './GameHeader';
import { GameView, type GameViewProps } from './GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { PlayerTimer } from '@/components/PlayerTimer';
import { useSfxStore } from '@/stores/sfxStore';
import { COLORS, FONT } from '@/constants/theme';

const CARD_HEIGHT = 90;

type Props = {
  // Header
  currentTurn: Color;
  status: GameStatus;
  abilityMode: AbilityMode;
  flashMessage: string | null;
  // Per-player clocks (White always bottom/host, Black always top/guest)
  whiteTimeMs: number | null;
  blackTimeMs: number | null;
  turnStartedAt: string | null;
  onTimeout: (color: Color) => void;
  // Info cards (Black above the board, White below)
  selectedPiece: Piece | null;
  // Board — passed straight through to GameView
  board: GameViewProps;
  // Replay button
  canReplay: boolean;
  triggerReplay: () => void;
  // Optional content above the header (online: matchup + viewer count + modal)
  topSlot?: ReactNode;
  // Trailing button(s) in the bottom row (Concede for players, EXIT for spectators)
  bottomActions: ReactNode;
};

/**
 * Shared shell for the local and online game screens: status bar, header with
 * the two player clocks, info-card slots flanking the board, the board itself,
 * and the REPLAY / SFX / action bottom row. Screens supply their own data,
 * a `topSlot` for anything above the header, and a `bottomActions` slot.
 */
export function GameBoardLayout({
  currentTurn, status, abilityMode, flashMessage,
  whiteTimeMs, blackTimeMs, turnStartedAt, onTimeout,
  selectedPiece, board, canReplay, triggerReplay, topSlot, bottomActions,
}: Props) {
  const { muted, toggleMute } = useSfxStore();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: 20 }} />
      {topSlot}
      <GameHeader
        currentTurn={currentTurn}
        status={status}
        abilityMode={abilityMode}
        flashMessage={flashMessage}
        leftSlot={
          <PlayerTimer
            label="WHITE"
            timeMs={whiteTimeMs}
            isActive={currentTurn === 'White' && status.type === 'active'}
            turnStartedAt={turnStartedAt}
            onTimeout={() => onTimeout('White')}
          />
        }
        rightSlot={
          <PlayerTimer
            label="BLACK"
            timeMs={blackTimeMs}
            isActive={currentTurn === 'Black' && status.type === 'active'}
            turnStartedAt={turnStartedAt}
            onTimeout={() => onTimeout('Black')}
          />
        }
      />
      <View style={[styles.cardSlot, { height: CARD_HEIGHT }]}>
        {selectedPiece?.color === 'Black' && (
          <SpriteInfoCard piece={selectedPiece} />
        )}
      </View>
      <GameView {...board} />
      <View style={[styles.cardSlot, { height: CARD_HEIGHT }]}>
        {selectedPiece?.color === 'White' && (
          <SpriteInfoCard piece={selectedPiece} />
        )}
      </View>
      <View style={styles.bottomRow}>
        <Pressable
          style={[styles.replayBtn, !canReplay && styles.replayDisabled]}
          onPress={triggerReplay}
          disabled={!canReplay}
        >
          <Text style={styles.replayText}>⟳ REPLAY</Text>
        </Pressable>
        <Pressable
          style={[styles.replayBtn, muted && styles.replayDisabled]}
          onPress={toggleMute}
        >
          <Text style={styles.replayText}>SFX</Text>
        </Pressable>
        {bottomActions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cardSlot: { justifyContent: 'center' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  replayBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  replayDisabled: { opacity: 0.4 },
  replayText: {
    color: COLORS.border,
    fontFamily: FONT.monoBold,
    fontSize: 12,
  },
});
