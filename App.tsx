import { SafeAreaView, StyleSheet, ActivityIndicator, View, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import type { ArmyConfig } from '@/types/army';
import { buildAIArmy, randomAIArmy } from '@/ai/buildArmy';
import { DIFFICULTIES } from '@/ai/chooseTurn';
import { TitleScreen } from '@/screens/Title';
import { LobbyScreen } from '@/screens/Lobby';
import { PointCapScreen } from '@/screens/PointCap';
import { WaitingRoomScreen } from '@/screens/WaitingRoom';
import { ArmyBuilderScreen } from '@/screens/ArmyBuilder';
import { HandoffScreen } from '@/screens/Handoff';
import { GameScreen } from '@/screens/Game';
import { SoloGameScreen } from '@/screens/SoloGame';
import { WatchGameScreen } from '@/screens/WatchGame';
import { OnlineArmyBuilderScreen } from '@/screens/OnlineArmyBuilder';
import { OnlineGameScreen } from '@/screens/OnlineGame';
import { SignInScreen } from '@/screens/SignIn';
import { NamePromptScreen } from '@/screens/NamePrompt';
import { useAuthStore } from '@/stores/authStore';
import { useScreenStore } from '@/stores/screenStore';
import { useGamesStore } from '@/stores/gamesStore';
import { useChatStore } from '@/stores/chatStore';
import { submitArmy } from '@/lib/games';
import { joinGamePresence, type Spectator } from '@/lib/presence';
import { useGameRouting } from '@/hooks/useGameRouting';
import { useOnlineGameActions } from '@/hooks/useOnlineGameActions';
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
  const liveGames = useGamesStore((s) => s.liveGames);
  const gamesLoading = useGamesStore((s) => s.loading);
  const fetchOpenGames = useGamesStore((s) => s.fetchOpenGames);
  const fetchLiveGames = useGamesStore((s) => s.fetchLiveGames);
  const startLobbySub = useGamesStore((s) => s.startLobbySubscription);
  const stopLobbySub = useGamesStore((s) => s.stopLobbySubscription);
  const createGameAction = useGamesStore((s) => s.createGame);
  const joinGameAction = useGamesStore((s) => s.joinGame);
  const cancelGameAction = useGamesStore((s) => s.cancelGame);
  const spectateAction = useGamesStore((s) => s.spectate);
  const exitSpectate = useGamesStore((s) => s.exitSpectate);
  const isSpectating = useGamesStore((s) => s.isSpectating);
  const setCurrentGame = useGamesStore((s) => s.setCurrentGame);
  const currentGame = useGamesStore((s) => s.currentGame);
  const restoreMyGame = useGamesStore((s) => s.restoreMyGame);
  const startGameSub = useGamesStore((s) => s.startGameSubscription);
  const stopGameSub = useGamesStore((s) => s.stopGameSubscription);

  // Live spectator list for the game currently on screen (players see it too;
  // tapping the count opens a viewer list).
  const [spectators, setSpectators] = useState<Spectator[]>([]);

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
      fetchLiveGames();
      startLobbySub();
      return () => stopLobbySub();
    }
  }, [authStatus, screen.type, fetchOpenGames, fetchLiveGames, startLobbySub, stopLobbySub]);

  // Join the per-game presence channel while a game is on screen so the
  // viewer count is live for players and spectators alike.
  useEffect(() => {
    if (!currentGame || !userId) return;
    if (currentGame.status !== 'active' && currentGame.status !== 'finished') return;
    const role = isSpectating ? 'spectator' : 'player';
    const name = profile?.display_name ?? 'anon';
    const leave = joinGamePresence(currentGame.id, userId, role, name, setSpectators);
    return () => {
      leave();
      setSpectators([]);
    };
  }, [currentGame?.id, currentGame?.status, userId, isSpectating, profile?.display_name]);

  // Chat: load history + open realtime channel while signed in
  const loadChat = useChatStore((s) => s.loadInitial);
  const startChatSub = useChatStore((s) => s.startSubscription);
  const stopChatSub = useChatStore((s) => s.stopSubscription);
  useEffect(() => {
    if (authStatus !== 'ready') return;
    loadChat();
    startChatSub();
    return () => stopChatSub();
  }, [authStatus, loadChat, startChatSub, stopChatSub]);

  useEffect(() => {
    if (!currentGame) return;
    startGameSub(currentGame.id);
    return () => stopGameSub();
  }, [currentGame?.id, startGameSub, stopGameSub]);

  // Route the screen state-machine off the current online game's status.
  useGameRouting();

  // Resign / timeout handlers for the online game screen.
  const { onResign, onTimeout } = useOnlineGameActions(currentGame, userId);

  // Stay on the title screen until the user taps "PRESS ENTER".
  const [titleDismissed, setTitleDismissed] = useState(false);

  if (!fontsLoaded) {
    // Fonts haven't loaded yet — minimal black screen with spinner
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00ff00" />
      </View>
    );
  }

  if (!titleDismissed) {
    return (
      <View style={styles.container}>
        <TitleScreen
          ready={authStatus !== 'loading'}
          onEnter={() => setTitleDismissed(true)}
        />
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
    if (screen.mode === 'local' || screen.mode === 'solo') {
      goTo({ type: 'armyBuilder', player: 1, pointCap, timePerTurnSeconds, vsAI: screen.mode === 'solo' });
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

  const handleSpectate = async (gameId: string) => {
    try {
      await spectateAction(gameId);
    } catch (err: any) {
      console.error('spectate failed', err);
      Alert.alert('Could not open game', err?.message ?? String(err));
    }
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
          liveGames={liveGames}
          loading={gamesLoading}
          myUserId={userId}
          onPlayLocal={() => goTo({ type: 'pointCap', mode: 'local' })}
          onPlayVsAI={() => goTo({ type: 'pointCap', mode: 'solo' })}
          onWatchAI={() =>
            goTo({
              type: 'watch',
              whiteArmy: randomAIArmy(60),
              blackArmy: randomAIArmy(60),
              difficulty: DIFFICULTIES.normal,
            })
          }
          onCreateOnline={() => goTo({ type: 'pointCap', mode: 'online' })}
          onJoinGame={handleJoinGame}
          onSpectate={handleSpectate}
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
            screen.vsAI
              ? goTo({
                  type: 'solo',
                  humanArmy: army,
                  // The AI builds after the human: mirror the guild, pick a
                  // random archetype, and spend the same point budget.
                  aiArmy: buildAIArmy(army, screen.pointCap),
                  difficulty: DIFFICULTIES.normal,
                })
              : goTo({
                  type: 'handoff',
                  pointCap: screen.pointCap,
                  timePerTurnSeconds: screen.timePerTurnSeconds,
                  player1Army: army,
                })
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
              timePerTurnSeconds: screen.timePerTurnSeconds,
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
            goTo({
              type: 'game',
              player1Army: screen.player1Army!,
              player2Army: army,
              timePerTurnSeconds: screen.timePerTurnSeconds,
            })
          }
        />
      )}
      {screen.type === 'game' && (
        <GameScreen
          p1Army={screen.player1Army}
          p2Army={screen.player2Army}
          timePerTurnSeconds={screen.timePerTurnSeconds}
          onMainMenu={resetToLobby}
        />
      )}
      {screen.type === 'solo' && (
        <SoloGameScreen
          humanArmy={screen.humanArmy}
          aiArmy={screen.aiArmy}
          difficulty={screen.difficulty}
          onMainMenu={resetToLobby}
        />
      )}
      {screen.type === 'watch' && (
        <WatchGameScreen
          whiteArmy={screen.whiteArmy}
          blackArmy={screen.blackArmy}
          difficulty={screen.difficulty}
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
          viewers={spectators}
          onExit={() => {
            setCurrentGame(null);
            resetToLobby();
          }}
          onResign={onResign}
          onTimeout={onTimeout}
        />
      )}
      {screen.type === 'spectate' && currentGame && currentGame.game_state && (
        <OnlineGameScreen
          spectator
          gameId={currentGame.id}
          initialState={currentGame.game_state}
          remoteState={currentGame.game_state}
          myColor="White"
          opponentName=""
          hostName={currentGame.host_name}
          guestName={currentGame.guest_name ?? undefined}
          viewers={spectators}
          hostTimeMs={currentGame.host_time_ms}
          guestTimeMs={currentGame.guest_time_ms}
          turnStartedAt={currentGame.turn_started_at}
          isHost={false}
          onExit={() => {
            exitSpectate();
            resetToLobby();
          }}
          onResign={() => {}}
          onTimeout={() => {}}
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
