import { SafeAreaView, StyleSheet, ActivityIndicator, View, Alert } from 'react-native';
import { useEffect } from 'react';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import type { ArmyConfig } from '@/types/army';
import { LobbyScreen } from '@/screens/Lobby';
import { PointCapScreen } from '@/screens/PointCap';
import { WaitingRoomScreen } from '@/screens/WaitingRoom';
import { ArmyBuilderScreen } from '@/screens/ArmyBuilder';
import { HandoffScreen } from '@/screens/Handoff';
import { GameScreen } from '@/screens/Game';
import { OnlineArmyBuilderScreen } from '@/screens/OnlineArmyBuilder';
import { OnlineGameScreen } from '@/screens/OnlineGame';
import { SignInScreen } from '@/screens/SignIn';
import { NamePromptScreen } from '@/screens/NamePrompt';
import { useAuthStore } from '@/stores/authStore';
import { useScreenStore } from '@/stores/screenStore';
import { useGamesStore } from '@/stores/gamesStore';
import { submitArmy, startGame, endOnlineGame } from '@/lib/games';
import { createInitialState } from '@/engine/initialBoard';
import { COLORS } from '@/constants/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  const authStatus = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.userId);
  const initAuth = useAuthStore((s) => s.init);
  const signIn = useAuthStore((s) => s.signIn);
  const signOutUser = useAuthStore((s) => s.signOut);
  const submitDisplayName = useAuthStore((s) => s.submitDisplayName);

  const screen = useScreenStore((s) => s.screen);
  const goTo = useScreenStore((s) => s.goTo);
  const resetToLobby = useScreenStore((s) => s.resetToLobby);

  const openGames = useGamesStore((s) => s.openGames);
  const gamesLoading = useGamesStore((s) => s.loading);
  const fetchOpenGames = useGamesStore((s) => s.fetchOpenGames);
  const startLobbySub = useGamesStore((s) => s.startLobbySubscription);
  const stopLobbySub = useGamesStore((s) => s.stopLobbySubscription);
  const createGameAction = useGamesStore((s) => s.createGame);
  const joinGameAction = useGamesStore((s) => s.joinGame);
  const cancelGameAction = useGamesStore((s) => s.cancelGame);
  const setCurrentGame = useGamesStore((s) => s.setCurrentGame);
  const currentGame = useGamesStore((s) => s.currentGame);
  const restoreMyGame = useGamesStore((s) => s.restoreMyGame);
  const startGameSub = useGamesStore((s) => s.startGameSubscription);
  const stopGameSub = useGamesStore((s) => s.stopGameSubscription);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // On auth ready, restore any active game we're in
  useEffect(() => {
    if (authStatus === 'ready' && userId && !currentGame) {
      restoreMyGame(userId);
    }
  }, [authStatus, userId]);

  useEffect(() => {
    if (authStatus === 'ready' && screen.type === 'lobby') {
      fetchOpenGames();
      startLobbySub();
      return () => stopLobbySub();
    }
  }, [authStatus, screen.type, fetchOpenGames, startLobbySub, stopLobbySub]);

  useEffect(() => {
    if (!currentGame) return;
    startGameSub(currentGame.id);
    return () => stopGameSub();
  }, [currentGame?.id, startGameSub, stopGameSub]);

  useEffect(() => {
    if (!currentGame || !userId) return;
    const isHost = currentGame.host_id === userId;

    if (currentGame.status === 'waiting') {
      if (screen.type !== 'waitingRoom') {
        goTo({ type: 'waitingRoom', gameId: currentGame.id });
      }
      return;
    }

    if (currentGame.status === 'army_select') {
      if (screen.type !== 'onlineArmyBuilder') {
        goTo({ type: 'onlineArmyBuilder', gameId: currentGame.id });
      }
      if (isHost && currentGame.host_army && currentGame.guest_army && !currentGame.game_state) {
        const initial = createInitialState(currentGame.host_army, currentGame.guest_army);
        startGame(currentGame.id, initial, currentGame.time_per_turn_seconds).catch(err => console.error('startGame failed', err));
      }
      return;
    }

    if (currentGame.status === 'active' || currentGame.status === 'finished') {
      // Both 'active' and 'finished' show the OnlineGameScreen so the win
      // overlay (driven by game_state.status) is visible. The user clicks
      // Main Menu to return to lobby.
      if (screen.type !== 'onlineGame') {
        goTo({ type: 'onlineGame', gameId: currentGame.id });
      }
      return;
    }

    if (currentGame.status === 'abandoned') {
      setCurrentGame(null);
      resetToLobby();
    }
  }, [currentGame, userId, screen.type, goTo, setCurrentGame, resetToLobby]);

  if (!fontsLoaded || authStatus === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00ff00" />
      </View>
    );
  }

  if (authStatus === 'signedOut') {
    return (
      <SafeAreaView style={styles.container}>
        <SignInScreen onSignIn={signIn} />
      </SafeAreaView>
    );
  }

  if (authStatus === 'needsName') {
    return (
      <SafeAreaView style={styles.container}>
        <NamePromptScreen onSubmit={submitDisplayName} />
      </SafeAreaView>
    );
  }

  const handlePointCapSubmit = async (pointCap: number, timePerTurnSeconds: number | null) => {
    if (screen.type !== 'pointCap') return;
    if (screen.mode === 'local') {
      goTo({ type: 'armyBuilder', player: 1, pointCap });
    } else {
      if (!userId || !profile) return;
      try {
        await createGameAction(userId, profile.display_name, pointCap, timePerTurnSeconds);
      } catch (err: any) {
        console.error('createGame failed', err);
        Alert.alert('Could not create game', err?.message ?? String(err));
      }
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!userId || !profile) return;
    await joinGameAction(gameId, userId, profile.display_name);
  };

  const handleArmySubmit = async (army: ArmyConfig) => {
    if (!currentGame || !userId) return;
    const isHost = currentGame.host_id === userId;
    await submitArmy(currentGame.id, isHost, army);
  };

  const isHost = currentGame ? currentGame.host_id === userId : false;
  const myColor: 'White' | 'Black' = isHost ? 'White' : 'Black';
  const opponentName = currentGame
    ? (isHost ? (currentGame.guest_name ?? 'opponent') : currentGame.host_name)
    : '';

  return (
    <SafeAreaView style={styles.container}>
      {screen.type === 'lobby' && profile && userId && (
        <LobbyScreen
          displayName={profile.display_name}
          openGames={openGames}
          loading={gamesLoading}
          myUserId={userId}
          onPlayLocal={() => goTo({ type: 'pointCap', mode: 'local' })}
          onCreateOnline={() => goTo({ type: 'pointCap', mode: 'online' })}
          onJoinGame={handleJoinGame}
          onSignOut={signOutUser}
        />
      )}
      {screen.type === 'pointCap' && (
        <PointCapScreen onStart={handlePointCapSubmit} />
      )}
      {screen.type === 'waitingRoom' && currentGame && (
        <WaitingRoomScreen
          pointCap={currentGame.point_cap}
          hostName={currentGame.host_name}
          onCancel={async () => {
            await cancelGameAction(currentGame.id);
            resetToLobby();
          }}
        />
      )}
      {screen.type === 'armyBuilder' && screen.player === 1 && (
        <ArmyBuilderScreen
          player={1}
          pointCap={screen.pointCap}
          onConfirm={(army) =>
            goTo({ type: 'handoff', pointCap: screen.pointCap, player1Army: army })
          }
        />
      )}
      {screen.type === 'handoff' && (
        <HandoffScreen
          onContinue={() =>
            goTo({
              type: 'armyBuilder',
              player: 2,
              pointCap: screen.pointCap,
              player1Army: screen.player1Army,
            })
          }
        />
      )}
      {screen.type === 'armyBuilder' && screen.player === 2 && (
        <ArmyBuilderScreen
          player={2}
          pointCap={screen.pointCap}
          onConfirm={(army) =>
            goTo({ type: 'game', player1Army: screen.player1Army!, player2Army: army })
          }
        />
      )}
      {screen.type === 'game' && (
        <GameScreen
          p1Army={screen.player1Army}
          p2Army={screen.player2Army}
          onMainMenu={resetToLobby}
        />
      )}
      {screen.type === 'onlineArmyBuilder' && currentGame && (
        <OnlineArmyBuilderScreen
          gameId={currentGame.id}
          pointCap={currentGame.point_cap}
          isHost={isHost}
          hasSubmitted={isHost ? !!currentGame.host_army : !!currentGame.guest_army}
          opponentSubmitted={isHost ? !!currentGame.guest_army : !!currentGame.host_army}
          onSubmit={handleArmySubmit}
        />
      )}
      {screen.type === 'onlineGame' && currentGame && currentGame.game_state && (
        <OnlineGameScreen
          gameId={currentGame.id}
          initialState={currentGame.game_state}
          remoteState={currentGame.game_state}
          myColor={myColor}
          opponentName={opponentName}
          hostTimeMs={currentGame.host_time_ms}
          guestTimeMs={currentGame.guest_time_ms}
          turnStartedAt={currentGame.turn_started_at}
          isHost={isHost}
          onExit={() => {
            setCurrentGame(null);
            resetToLobby();
          }}
          onResign={async () => {
            if (!currentGame || !userId || !currentGame.game_state) return;
            if (currentGame.status !== 'active') return;
            // The player who taps Concede loses. Host is White, guest is Black.
            const myColorComputed: 'White' | 'Black' = isHost ? 'White' : 'Black';
            const winnerColor: 'White' | 'Black' = myColorComputed === 'White' ? 'Black' : 'White';
            const winnerId = winnerColor === 'White'
              ? currentGame.host_id
              : currentGame.guest_id;
            if (!winnerId) return;
            try {
              await endOnlineGame(currentGame.id, currentGame.game_state, winnerColor, winnerId, 'resign');
            } catch (err: any) {
              console.error('resignGame failed:', err?.message ?? err);
            }
          }}
          onTimeout={async (loserColor) => {
            if (!currentGame || !currentGame.game_state) return;
            if (currentGame.status !== 'active') return;
            const winnerColor: 'White' | 'Black' = loserColor === 'White' ? 'Black' : 'White';
            // Host is White, guest is Black.
            const winnerId = winnerColor === 'White' ? currentGame.host_id : currentGame.guest_id;
            if (!winnerId) return;
            try {
              await endOnlineGame(currentGame.id, currentGame.game_state, winnerColor, winnerId, 'timeout');
            } catch (err: any) {
              console.error('timeout resignGame failed:', err?.message ?? err);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
