import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { GameState, Color } from '@/types/game';
import { GameHeader } from '@/screens/Game/GameHeader';
import { GameView } from '@/screens/Game/GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { ConcedeButton } from '@/components/ConcedeButton';
import { PlayerTimer } from '@/components/PlayerTimer';
import { useSfxStore } from '@/stores/sfxStore';
import { useOnlineGame } from './useOnlineGame';
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
};

export function OnlineGameScreen({
  gameId, initialState, remoteState, myColor, opponentName,
  hostTimeMs, guestTimeMs, turnStartedAt, isHost,
  onExit, onResign, onTimeout,
}: Props) {
  const {
    pieces, currentTurn, selectedSquare, selectedPiece, selectedCanActivate,
    highlights, abilityMode, status, lastEffect, isMyTurn,
    replayRequest, canReplay, triggerReplay, onSquarePress,
  } = useOnlineGame({
    gameId, initialState, remoteState, myColor,
    hostTimeMs, guestTimeMs, turnStartedAt, isHost,
  });

  const { muted, toggleMute } = useSfxStore();

  const whiteTimeMs = isHost ? hostTimeMs : guestTimeMs;
  const blackTimeMs = isHost ? guestTimeMs : hostTimeMs;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: 20 }} />
      <View style={styles.turnIndicator}>
        <Text style={styles.youAre}>YOU: {myColor}</Text>
        <Text style={styles.opp}>vs {opponentName}</Text>
      </View>
      <GameHeader
        currentTurn={currentTurn}
        status={status}
        abilityMode={abilityMode}
        flashMessage={!isMyTurn && status.type === 'active' ? `waiting for ${opponentName}...` : null}
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
        <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
      </View>
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
});
