import { Pressable, Text, StyleSheet } from 'react-native';
import type { ArmyConfig } from '@/types/army';
import type { Difficulty } from '@/ai/chooseTurn';
import { useSoloGame } from '@/screens/SoloGame/useSoloGame';
import { GameBoardLayout } from '@/screens/Game/GameBoardLayout';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  whiteArmy: ArmyConfig;
  blackArmy: ArmyConfig;
  difficulty: Difficulty;
  onMainMenu?: () => void;
};

/** AI vs AI: the bot drives both sides while the human watches (read-only). */
export function WatchGameScreen({ whiteArmy, blackArmy, difficulty, onMainMenu }: Props) {
  const {
    pieces, currentTurn, selectedSquare, selectedPiece, selectedCanActivate,
    highlights, abilityMode, status, lastEffect, flashMessage,
    replayRequest, canReplay, triggerReplay,
    onSquarePress, onNewGame,
  } = useSoloGame({ whiteArmy, blackArmy, difficulty, humanColor: null });

  return (
    <GameBoardLayout
      currentTurn={currentTurn}
      status={status}
      abilityMode={abilityMode}
      flashMessage={flashMessage}
      whiteTimeMs={null}
      blackTimeMs={null}
      turnStartedAt={null}
      onTimeout={() => {}}
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
        onNewGame,
        onMainMenu,
      }}
      bottomActions={
        <Pressable style={styles.exitBtn} onPress={onMainMenu}>
          <Text style={styles.exitText}>EXIT</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
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
});
