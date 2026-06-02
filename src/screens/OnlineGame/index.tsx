import { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import type { GameState, Color } from '@/types/game';
import type { Spectator } from '@/lib/presence';
import { GameBoardLayout } from '@/screens/Game/GameBoardLayout';
import { ConcedeButton } from '@/components/ConcedeButton';
import { useOnlineGame } from './useOnlineGame';
import { colorTimes } from './colorTimes';
import { OnlineMatchupBar } from './OnlineMatchupBar';
import { ViewerListModal } from './ViewerListModal';
import { COLORS, FONT } from '@/constants/theme';

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
  // Read-only watcher mode (see useOnlineGame). When set, the bottom row
  // shows EXIT instead of Concede, and a viewer count + matchup are shown.
  spectator?: boolean;
  // Live spectators of this game; tapping the count lists their names.
  viewers?: Spectator[];
  hostName?: string;
  guestName?: string;
};

export function OnlineGameScreen({
  gameId, initialState, remoteState, myColor, opponentName,
  hostTimeMs, guestTimeMs, turnStartedAt, isHost,
  onExit, onResign, onTimeout,
  spectator = false, viewers = [], hostName, guestName,
}: Props) {
  const [showViewers, setShowViewers] = useState(false);
  const {
    pieces, currentTurn, selectedSquare, selectedPiece, selectedCanActivate,
    highlights, abilityMode, status, lastEffect, isMyTurn,
    replayRequest, canReplay, triggerReplay, onSquarePress,
  } = useOnlineGame({
    gameId, initialState, remoteState, myColor,
    hostTimeMs, guestTimeMs, turnStartedAt, isHost, spectator,
  });

  // White is always the host, Black the guest — for players and spectators
  // alike, since the board never flips. (See colorTimes; the old per-seat
  // branching swapped the clocks for the guest.)
  const { whiteTimeMs, blackTimeMs } = colorTimes(hostTimeMs, guestTimeMs);

  return (
    <GameBoardLayout
      currentTurn={currentTurn}
      status={status}
      abilityMode={abilityMode}
      flashMessage={!spectator && !isMyTurn && status.type === 'active' ? `waiting for ${opponentName}...` : null}
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
        onMainMenu: onExit,
      }}
      topSlot={
        <>
          <OnlineMatchupBar
            spectator={spectator}
            myColor={myColor}
            opponentName={opponentName}
            hostName={hostName}
            guestName={guestName}
            viewerCount={viewers.length}
            onShowViewers={() => setShowViewers(true)}
          />
          <ViewerListModal
            visible={showViewers}
            viewers={viewers}
            onClose={() => setShowViewers(false)}
          />
        </>
      }
      bottomActions={
        spectator ? (
          <Pressable style={styles.exitBtn} onPress={onExit}>
            <Text style={styles.exitText}>EXIT</Text>
          </Pressable>
        ) : (
          <ConcedeButton onConcede={onResign} disabled={status.type === 'won'} />
        )
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
