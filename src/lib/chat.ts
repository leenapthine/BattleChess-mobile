import { supabase } from './supabase';

export type ChatMessage = {
  id: string;
  channel: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
};

const CHANNEL = 'lobby';
export const CHAT_MAX_LENGTH = 300;

export async function fetchRecentMessages(limit = 50): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel', CHANNEL)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function sendMessage(
  userId: string,
  displayName: string,
  body: string,
): Promise<void> {
  const trimmed = body.trim().slice(0, CHAT_MAX_LENGTH);
  if (!trimmed) return;
  const { error } = await supabase.from('chat_messages').insert({
    channel: CHANNEL,
    user_id: userId,
    display_name: displayName,
    message: trimmed,
  });
  if (error) throw error;
}

export function subscribeToChat(onInsert: (msg: ChatMessage) => void): () => void {
  const channel = supabase
    .channel('chat_lobby')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel=eq.${CHANNEL}` },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
