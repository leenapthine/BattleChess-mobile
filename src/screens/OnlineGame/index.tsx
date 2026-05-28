import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { GameState, Color } from '@/types/game';
import { GameHeader } from '@/screens/Game/GameHeader';
import { GameView } from '@/screens/Game/GameView';
import { SpriteInfoCard } from '@/components/SpriteInfoCard';
import { useOnlineGame } from './useOnlineGame';
import { COLORS, FONT } from '@/constants/theme';

const CARD_HEIGHT = 90;

type Props = {
  gameId: string;
  initialState: GameState;
  remoteState: GameState | null;
  myColor: Color;
  opponentName: string;
  onExit: () => void;
};

export function OnlineGameScreen({
  gameId, initialState, remoteState, myColor, opponentName, onExit,
}: Props) {
  const {
    pieces, currentTurn, selectedSquare, selectedPiece, selectedCanActivate,
    highlights, abilityMode, status, isMyTurn, onSquarePress,
  } = useOnlineGame({ gameId, initialState, remoteState, myColor });

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
        onSquarePress={onSquarePress}
        onNewGame={onExit}
      />
      <View style={[styles.cardSlot, { height: CARD_HEIGHT }]}>
        {selectedPiece?.color === 'White' && (
          <SpriteInfoCard piece={selectedPiece} />
        )}
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
});
