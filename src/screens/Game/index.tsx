import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { ArmyConfig } from '@/types/army';
import { useGame } from './useGame';
import { GameHeader } from './GameHeader';
import { GameView } from './GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { COLORS } from '@/constants/theme';

type Props = {
  p1Army: ArmyConfig;
  p2Army: ArmyConfig;
};

export function GameScreen({ p1Army, p2Army }: Props) {
  const {
    pieces,
    currentTurn,
    selectedSquare,
    selectedPiece,
    selectedCanActivate,
    highlights,
    abilityMode,
    status,
    flashMessage,
    onSquarePress,
    onNewGame,
  } = useGame({ p1Army, p2Army });

  const { width, height } = useWindowDimensions();
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
        onSquarePress={onSquarePress}
        onNewGame={onNewGame}
      />
      <View style={[styles.cardSlot, { height: cardHeight }]}>
        {selectedPiece?.color === 'White' && (
          <SpriteInfoCard piece={selectedPiece} />
        )}
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
});
