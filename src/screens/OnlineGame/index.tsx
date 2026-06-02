import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { GameState, Color } from '@/types/game';
import type { Spectator } from '@/lib/presence';
import { GameHeader } from '@/screens/Game/GameHeader';
import { GameView } from '@/screens/Game/GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { ConcedeButton } from '@/components/ConcedeButton';
import { PlayerTimer } from '@/components/PlayerTimer';
import { useSfxStore } from '@/stores/sfxStore';
import { useOnlineGame } from './useOnlineGame';
import { colorTimes } from './colorTimes';
import { COLORS, FONT } from '@/constants/theme';

const CARD_HEIGHT = 90;

type Props = {
  gameId: string;
  initialState: GameState;
  remoteState: GameState | null;
  myColor: Color;
  opponentName: string;
  hostTimeMs: number | null;
  guestTimeMs: number | null;
  turnStartedAt: string | null;
  isHost: boolean;
  onExit: () => void;
  onResign: () => void;
  onTimeout: (loserColor: Color) => void;
  // Read-only watcher mode (see useOnlineGame). When set, the bottom row
  // shows EXIT instead of Concede, and a viewer count + matchup are shown.
  spectator?: boolean;
  // Live spectators of this game; tapping the count lists their names.
  viewers?: Spectator[];
  hostName?: string;
  guestName?: string;
};

export function OnlineGameScreen({
  gameId, initialState, remoteState, myColor, opponentName,
  hostTimeMs, guestTimeMs, turnStartedAt, isHost,
  onExit, onResign, onTimeout,
  spectator = false, viewers = [], hostName, guestName,
}: Props) {
  const [showViewers, setShowViewers] = useState(false);
  const viewerCount = viewers.length;
  const {
    pieces, currentTurn, selectedSquare, selectedPiece, selectedCanActivate,
    highlights, abilityMode, status, lastEffect, isMyTurn,
    replayRequest, canReplay, triggerReplay, onSquarePress,
  } = useOnlineGame({
    gameId, initialState, remoteState, myColor,
    hostTimeMs, guestTimeMs, turnStartedAt, isHost, spectator,
  });

  const { muted, toggleMute } = useSfxStore();

  // White is always the host, Black the guest — for players and spectators
  // alike, since the board never flips. (See colorTimes; the old per-seat
  // branching swapped the clocks for the guest.)
  const { whiteTimeMs, blackTimeMs } = colorTimes(hostTimeMs, guestTimeMs);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: 20 }} />
      <View style={styles.turnIndicator}>
        {spectator ? (
          <Text style={styles.youAre}>{hostName} (W) vs {guestName ?? '?'} (B)</Text>
        ) : (
          <Text style={styles.youAre}>YOU: {myColor}  vs {opponentName}</Text>
        )}
        {viewerCount > 0 && (
          <Pressable onPress={() => setShowViewers(true)} hitSlop={8}>
            <Text style={styles.viewers}>👁 {viewerCount}</Text>
          </Pressable>
        )}
      </View>
      <GameHeader
        currentTurn={currentTurn}
        status={status}
        abilityMode={abilityMode}
        flashMessage={!spectator && !isMyTurn && status.type === 'active' ? `waiting for ${opponentName}...` : null}
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
      <GameView
        pieces={pieces}
        selectedSquare={selectedSquare}
        selectedCanActivate={selectedCanActivate}
        highlights={highlights}
        status={status}
        lastEffect={lastEffect}
        replayRequest={replayRequest}
        onSquarePress={onSquarePress}
        onMainMenu={onExit}
      />
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
        {spectator ? (
          <Pressable style={styles.replayBtn} onPress={onExit}>
            <Text style={styles.replayText}>EXIT</Text>
          </Pressable>
        ) : (
          <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
        )}
      </View>

      <Modal
        visible={showViewers}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewers(false)}
      >
        {/* Tap the backdrop to dismiss; the inner card swallows the press. */}
        <Pressable style={styles.modalBackdrop} onPress={() => setShowViewers(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>👁 WATCHING ({viewerCount})</Text>
            <ScrollView style={styles.modalList}>
              {viewers.length === 0 ? (
                <Text style={styles.modalEmpty}>no spectators</Text>
              ) : (
                viewers.map((v) => (
                  <Text key={v.userId} style={styles.modalName}>{v.name}</Text>
                ))
              )}
            </ScrollView>
            <Pressable style={styles.replayBtn} onPress={() => setShowViewers(false)}>
              <Text style={styles.replayText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cardSlot: { justifyContent: 'center' },
  turnIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  youAre: { color: COLORS.text, fontFamily: FONT.monoBold, fontSize: 11 },
  opp: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 11 },
  viewers: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 11 },
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
  replayDisabled: {
    opacity: 0.4,
  },
  replayText: {
    color: COLORS.border,
    fontFamily: FONT.monoBold,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '60%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 6,
    padding: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalList: { flexGrow: 0, marginBottom: 12 },
  modalName: {
    color: COLORS.text,
    fontFamily: FONT.mono,
    fontSize: 13,
    paddingVertical: 4,
  },
  modalEmpty: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
