import type { ArmyConfig } from '@/types/army';
import { useGame } from './useGame';
import { GameBoardLayout } from './GameBoardLayout';
import { ConcedeButton } from '@/components/ConcedeButton';

type Props = {
  p1Army: ArmyConfig;
  p2Army: ArmyConfig;
  timePerTurnSeconds: number | null;
  onMainMenu?: () => void;
};

export function GameScreen({ p1Army, p2Army, timePerTurnSeconds, onMainMenu }: Props) {
  const {
    pieces, currentTurn, selectedSquare, selectedPiece, selectedCanActivate,
    highlights, abilityMode, status, lastEffect, flashMessage,
    whiteTimeMs, blackTimeMs, turnStartedAt,
    replayRequest, canReplay, triggerReplay,
    onSquarePress, onNewGame, onResign, onTimeout,
  } = useGame({ p1Army, p2Army, timePerTurnSeconds });

  return (
    <GameBoardLayout
      currentTurn={currentTurn}
      status={status}
      abilityMode={abilityMode}
      flashMessage={flashMessage}
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
        onNewGame,
        onMainMenu,
      }}
      bottomActions={
        <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
      }
    />
  );
}
