import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { COLORS, FONT } from '@/constants/theme';
import { CHAT_MAX_LENGTH, type ChatMessage } from '@/lib/chat';

type Props = {
  messages: ChatMessage[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  sending: boolean;
  myUserId: string;
  onSend: (body: string) => Promise<void>;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function ChatView({ messages, status, sending, myUserId, onSend }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body) return;
    setError(null);
    try {
      await onSend(body);
      setInput('');
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.toLowerCase().includes('rate limit')) {
        setError('slow down — 1 message every 2 seconds');
      } else {
        setError('failed to send');
      }
    }
  };

  const canSend = input.trim().length > 0 && !sending;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {status === 'loading' && (
          <Text style={styles.systemLine}>connecting...</Text>
        )}
        {status === 'error' && (
          <Text style={styles.errorLine}>chat unavailable</Text>
        )}
        {status === 'ready' && messages.length === 0 && (
          <Text style={styles.systemLine}>no messages yet — say hi</Text>
        )}
        {messages.map((m) => {
          const isMe = m.user_id === myUserId;
          return (
            <View key={m.id} style={styles.row}>
              <Text style={styles.time}>{formatTime(m.created_at)}</Text>
              <Text style={[styles.name, isMe && styles.nameMe]}>{m.display_name}</Text>
              <Text style={styles.prompt}>{' > '}</Text>
              <Text style={styles.body}>{m.message}</Text>
            </View>
          );
        })}
      </ScrollView>

      {error && <Text style={styles.errorInline}>{error}</Text>}

      <View style={styles.inputRow}>
        <Text style={styles.inputPrompt}>{'> '}</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="type a message..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          maxLength={CHAT_MAX_LENGTH}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!sending}
        />
        <Pressable
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Text style={[styles.sendText, !canSend && styles.sendTextDisabled]}>SEND</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  time: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
    marginRight: 6,
  },
  name: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 11,
  },
  nameMe: {
    color: '#ffe066',
  },
  prompt: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
  },
  body: {
    color: '#ffffff',
    fontFamily: FONT.mono,
    fontSize: 11,
    flexShrink: 1,
  },
  systemLine: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  errorLine: {
    color: '#ff6666',
    fontFamily: FONT.mono,
    fontSize: 11,
    paddingVertical: 4,
  },
  errorInline: {
    color: '#ff6666',
    fontFamily: FONT.mono,
    fontSize: 10,
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.cardBg,
  },
  inputPrompt: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 13,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontFamily: FONT.mono,
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  sendBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
  },
  sendText: {
    color: '#000000',
    fontFamily: FONT.monoBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  sendTextDisabled: {
    color: COLORS.textMuted,
  },
});
