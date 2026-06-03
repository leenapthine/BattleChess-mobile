import type { ArmyConfig } from '@/types/army';
import type { Difficulty } from '@/ai/chooseTurn';
import { useSoloGame } from './useSoloGame';
import { GameBoardLayout } from '@/screens/Game/GameBoardLayout';
import { ConcedeButton } from '@/components/ConcedeButton';

type Props = {
  humanArmy: ArmyConfig;
  aiArmy: ArmyConfig;
  difficulty: Difficulty;
  onMainMenu?: () => void;
};

export function SoloGameScreen({ humanArmy, aiArmy, difficulty, onMainMenu }: Props) {
  const {
    pieces, currentTurn, selectedSquare, selectedPiece, selectedCanActivate,
    highlights, abilityMode, status, lastEffect, flashMessage,
    replayRequest, canReplay, triggerReplay,
    onSquarePress, onNewGame, onResign,
  } = useSoloGame({ humanArmy, aiArmy, difficulty });

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
        <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
      }
    />
  );
}
