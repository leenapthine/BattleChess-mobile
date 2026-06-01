import { View, Pressable, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { ArmyConfig } from '@/types/army';
import { useGame } from './useGame';
import { GameHeader } from './GameHeader';
import { GameView } from './GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { ConcedeButton } from '@/components/ConcedeButton';
import { PlayerTimer } from '@/components/PlayerTimer';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  p1Army: ArmyConfig;
  p2Army: ArmyConfig;
  timePerTurnSeconds: number | null;
  onMainMenu?: () => void;
};

export function GameScreen({ p1Army, p2Army, timePerTurnSeconds, onMainMenu }: Props) {
  const {
    pieces,
    currentTurn,
    selectedSquare,
    selectedPiece,
    selectedCanActivate,
    highlights,
    abilityMode,
    status,
    lastEffect,
    flashMessage,
    whiteTimeMs,
    blackTimeMs,
    turnStartedAt,
    replayRequest,
    canReplay,
    triggerReplay,
    onSquarePress,
    onNewGame,
    onResign,
    onTimeout,
  } = useGame({ p1Army, p2Army, timePerTurnSeconds });

  const cardHeight = 90;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: 20 }} />
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
      <View style={[styles.cardSlot, { height: cardHeight }]}>
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
        onNewGame={onNewGame}
        onMainMenu={onMainMenu}
      />
      <View style={[styles.cardSlot, { height: cardHeight }]}>
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
        <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cardSlot: {
    justifyContent: 'center',
  },
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
