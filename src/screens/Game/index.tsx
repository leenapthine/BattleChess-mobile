import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { ArmyConfig } from '@/types/army';
import { useGame } from './useGame';
import { GameHeader } from './GameHeader';
import { GameView } from './GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { ConcedeButton } from '@/components/ConcedeButton';
import { COLORS } from '@/constants/theme';

type Props = {
  p1Army: ArmyConfig;
  p2Army: ArmyConfig;
  onMainMenu?: () => void;
};

export function GameScreen({ p1Army, p2Army, onMainMenu }: Props) {
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
    onResign,
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
  cardSlot: {
    justifyContent: 'center',
  },
});
