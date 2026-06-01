import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { ArmyConfig } from '@/types/army';
import { useGame } from './useGame';
import { GameHeader } from './GameHeader';
import { GameView } from './GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { ConcedeButton } from '@/components/ConcedeButton';
import { PlayerTimer } from '@/components/PlayerTimer';
import { COLORS } from '@/constants/theme';

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
      <View style={styles.timerBar}>
        <PlayerTimer
          label="WHITE"
          timeMs={whiteTimeMs}
          isActive={currentTurn === 'White' && status.type === 'active'}
          turnStartedAt={turnStartedAt}
          onTimeout={() => onTimeout('White')}
        />
        <View style={styles.headerWrap}>
          <GameHeader
            currentTurn={currentTurn}
            status={status}
            abilityMode={abilityMode}
            flashMessage={flashMessage}
          />
        </View>
        <PlayerTimer
          label="BLACK"
          timeMs={blackTimeMs}
          isActive={currentTurn === 'Black' && status.type === 'active'}
          turnStartedAt={turnStartedAt}
          onTimeout={() => onTimeout('Black')}
        />
      </View>
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
        onSquarePress={onSquarePress}
        onNewGame={onNewGame}
        onMainMenu={onMainMenu}
      />
      <View style={[styles.cardSlot, { height: cardHeight }]}>
        {selectedPiece?.color === 'White' && (
          <SpriteInfoCard piece={selectedPiece} />
        )}
      </View>
      <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  headerWrap: {
    flex: 1,
  },
  cardSlot: {
    justifyContent: 'center',
  },
});
