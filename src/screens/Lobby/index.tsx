import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { GameRow } from '@/lib/games';
import { COLORS, FONT } from '@/constants/theme';
import { useChatStore } from '@/stores/chatStore';
import { ChatView } from './ChatView';

type Props = {
  displayName: string;
  openGames: GameRow[];
  loading: boolean;
  myUserId: string;
  onPlayLocal: () => void;
  onCreateOnline: () => void;
  onJoinGame: (gameId: string) => void;
  onSignOut: () => void;
};

const CHAT_HEIGHT = 240;

export function LobbyScreen({
  displayName,
  openGames,
  loading,
  myUserId,
  onPlayLocal,
  onCreateOnline,
  onJoinGame,
  onSignOut,
}: Props) {
  const otherGames = openGames.filter((g) => g.host_id !== myUserId);

  const chatMessages = useChatStore((s) => s.messages);
  const chatStatus = useChatStore((s) => s.status);
  const chatSending = useChatStore((s) => s.sending);
  const sendChat = useChatStore((s) => s.send);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BATTLECHESS</Text>
        <Pressable onPress={onSignOut}>
          <Text style={styles.signOut}>sign out</Text>
        </Pressable>
      </View>
      <Text style={styles.greeting}>signed in as {displayName}</Text>

      <Text style={styles.sectionLabel}>LOBBY CHAT</Text>
      <View style={{ height: CHAT_HEIGHT }}>
        <ChatView
          messages={chatMessages}
          status={chatStatus}
          sending={chatSending}
          myUserId={myUserId}
          onSend={(body) => sendChat(myUserId, displayName, body)}
        />
      </View>

      <Text style={styles.sectionLabel}>NEW GAME</Text>
      <Pressable style={styles.modeBtn} onPress={onPlayLocal}>
        <Text style={styles.modeTitle}>PLAY LOCAL</Text>
        <Text style={styles.modeDesc}>pass and play on one device</Text>
      </Pressable>
      <Pressable style={styles.modeBtn} onPress={onCreateOnline}>
        <Text style={styles.modeTitle}>PLAY ONLINE</Text>
        <Text style={styles.modeDesc}>create a game and wait for opponent</Text>
      </Pressable>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>OPEN GAMES</Text>
        {loading && <ActivityIndicator size="small" color={COLORS.text} />}
      </View>
      <ScrollView
        style={styles.gamesScroll}
        contentContainerStyle={styles.gamesContent}
      >
        {otherGames.length === 0 && !loading && (
          <Text style={styles.empty}>no open games yet</Text>
        )}
        {otherGames.map((g) => (
          <Pressable key={g.id} style={styles.gameRow} onPress={() => onJoinGame(g.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gameHost}>{g.host_name}</Text>
              <Text style={styles.gamePoints}>{g.point_cap} pts</Text>
            </View>
            <Text style={styles.joinText}>JOIN</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { color: COLORS.text, fontFamily: FONT.monoBold, fontSize: 28 },
  signOut: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 12 },
  greeting: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 12, marginBottom: 8 },

  sectionLabel: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  modeBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    padding: 12,
    marginBottom: 6,
    borderRadius: 4,
  },
  modeTitle: { color: COLORS.text, fontFamily: FONT.monoBold, fontSize: 14, marginBottom: 2 },
  modeDesc: { color: '#ffffff', fontFamily: FONT.mono, fontSize: 11 },

  gamesScroll: { flex: 1 },
  gamesContent: { paddingBottom: 16 },

  empty: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    padding: 10,
    marginBottom: 6,
    borderRadius: 4,
  },
  gameHost: { color: COLORS.text, fontFamily: FONT.monoBold, fontSize: 14 },
  gamePoints: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 11 },
  joinText: {
    color: '#000000',
    fontFamily: FONT.monoBold,
    fontSize: 12,
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
});
