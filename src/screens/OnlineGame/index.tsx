import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import type { GameState, Color } from '@/types/game';
import type { Spectator } from '@/lib/presence';
import { GameBoardLayout } from '@/screens/Game/GameBoardLayout';
import { ConcedeButton } from '@/components/ConcedeButton';
import { useOnlineGame } from './useOnlineGame';
import { colorTimes } from './colorTimes';
import { COLORS, FONT } from '@/constants/theme';

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

  // White is always the host, Black the guest — for players and spectators
  // alike, since the board never flips. (See colorTimes; the old per-seat
  // branching swapped the clocks for the guest.)
  const { whiteTimeMs, blackTimeMs } = colorTimes(hostTimeMs, guestTimeMs);

  return (
    <GameBoardLayout
      currentTurn={currentTurn}
      status={status}
      abilityMode={abilityMode}
      flashMessage={!spectator && !isMyTurn && status.type === 'active' ? `waiting for ${opponentName}...` : null}
      whiteTimeMs={whiteTimeMs}
      blackTimeMs={blackTimeMs}
      turnStartedAt={turnStartedAt}
      onTimeout={onTimeout}
      selectedPiece={selectedPiece}
      canReplay={canReplay}
      triggerReplay={triggerReplay}
      board={{
        pieces,
        selectedSquare,
        selectedCanActivate,
        highlights,
        status,
        lastEffect,
        replayRequest,
        onSquarePress,
        onMainMenu: onExit,
      }}
      topSlot={
        <>
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
          <ViewerListModal
            visible={showViewers}
            viewers={viewers}
            onClose={() => setShowViewers(false)}
          />
        </>
      }
      bottomActions={
        spectator ? (
          <Pressable style={styles.exitBtn} onPress={onExit}>
            <Text style={styles.exitText}>EXIT</Text>
          </Pressable>
        ) : (
          <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
        )
      }
    />
  );
}

function ViewerListModal({
  visible, viewers, onClose,
}: { visible: boolean; viewers: Spectator[]; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tap the backdrop to dismiss; the inner card swallows the press. */}
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>👁 WATCHING ({viewers.length})</Text>
          <ScrollView style={styles.modalList}>
            {viewers.length === 0 ? (
              <Text style={styles.modalEmpty}>no spectators</Text>
            ) : (
              viewers.map((v) => (
                <Text key={v.userId} style={styles.modalName}>{v.name}</Text>
              ))
            )}
          </ScrollView>
          <Pressable style={styles.exitBtn} onPress={onClose}>
            <Text style={styles.exitText}>CLOSE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  turnIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  youAre: { color: COLORS.text, fontFamily: FONT.monoBold, fontSize: 11 },
  viewers: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 11 },
  exitBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  exitText: {
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
