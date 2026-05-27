import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGame } from './useGame';
import { GameHeader } from './GameHeader';
import { GameView } from './GameView';
import { CapturedPieces } from '@/components/CapturedPieces';
import { COLORS } from '@/constants/theme';

export function GameScreen() {
  const {
    pieces,
    capturedPieces,
    currentTurn,
    selectedSquare,
    selectedCanActivate,
    highlights,
    abilityMode,
    status,
    flashMessage,
    onSquarePress,
    onNewGame,
  } = useGame();

  const { width } = useWindowDimensions();
  const spriteSize = Math.min(width - 16, 400) / 16;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <GameHeader
        currentTurn={currentTurn}
        status={status}
        abilityMode={abilityMode}
        flashMessage={flashMessage}
      />
      <View style={styles.boardContainer}>
        <CapturedPieces pieces={capturedPieces} color="Black" spriteSize={spriteSize} />
        <GameView
          pieces={pieces}
          selectedSquare={selectedSquare}
          selectedCanActivate={selectedCanActivate}
          highlights={highlights}
          status={status}
          onSquarePress={onSquarePress}
          onNewGame={onNewGame}
        />
        <CapturedPieces pieces={capturedPieces} color="White" spriteSize={spriteSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
