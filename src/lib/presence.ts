import { supabase } from './supabase';

type PresenceRole = 'player' | 'spectator';

export type Spectator = { userId: string; name: string };

/**
 * Joins a per-game Realtime presence channel and reports the live spectator
 * list. Both players and spectators join (so everyone can see who's watching);
 * each entry carries its `role` + `name`, and only `spectator` entries are
 * surfaced. De-duped by user id so multiple tabs count once.
 *
 * Pure lib — no React. Returns an unsubscribe that leaves the channel.
 */
export function joinGamePresence(
  gameId: string,
  userId: string,
  role: PresenceRole,
  name: string,
  onSpectators: (spectators: Spectator[]) => void,
): () => void {
  const channel = supabase.channel(`presence_game_${gameId}`, {
    config: { presence: { key: userId } },
  });

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<{ role: PresenceRole; name: string }>();
    const byUser = new Map<string, string>();
    Object.entries(state).forEach(([key, entries]) => {
      entries.forEach((entry) => {
        if (entry.role === 'spectator') byUser.set(key, entry.name);
      });
    });
    onSpectators([...byUser].map(([id, n]) => ({ userId: id, name: n })));
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.track({ role, name }).catch(() => {});
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
