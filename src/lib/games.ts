import { supabase } from './supabase';
import type { ArmyConfig } from '@/types/army';
import type { GameState } from '@/types/game';

export type GameStatus = 'waiting' | 'army_select' | 'active' | 'finished' | 'abandoned';

export type GameRow = {
  id: string;
  host_id: string;
  guest_id: string | null;
  host_name: string;
  guest_name: string | null;
  status: GameStatus;
  point_cap: number;
  time_per_turn_seconds: number | null; // null = no timer
  host_time_ms: number | null;
  guest_time_ms: number | null;
  turn_started_at: string | null;
  host_army: ArmyConfig | null;
  guest_army: ArmyConfig | null;
  game_state: GameState | null;
  winner_id: string | null;
  last_action_at: string;
  created_at: string;
  updated_at: string;
};

const STALE_MINUTES = 10;

export async function listOpenGames(): Promise<GameRow[]> {
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'waiting')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GameRow[];
}

export async function findMyActiveGame(userId: string): Promise<GameRow | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .in('status', ['waiting', 'army_select', 'active'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as GameRow | null;
}

export async function cleanupMyOrphans(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('host_id', userId)
    .eq('status', 'waiting')
    .lt('created_at', cutoff);
  if (error) console.error('cleanupMyOrphans failed', error);
}

export async function createGame(
  hostId: string,
  hostName: string,
  pointCap: number,
  timePerTurnSeconds: number | null,
): Promise<GameRow> {
  const { data, error } = await supabase
    .from('games')
    .insert({
      host_id: hostId,
      host_name: hostName,
      point_cap: pointCap,
      time_per_turn_seconds: timePerTurnSeconds,
      status: 'waiting',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as GameRow;
}

export async function joinGame(
  gameId: string,
  guestId: string,
  guestName: string,
): Promise<GameRow> {
  const { data, error } = await supabase
    .from('games')
    .update({
      guest_id: guestId,
      guest_name: guestName,
      status: 'army_select',
    })
    .eq('id', gameId)
    .eq('status', 'waiting')
    .select('*')
    .single();
  if (error) throw error;
  return data as GameRow;
}

export async function cancelGame(gameId: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', gameId);
  if (error) throw error;
}

export async function submitArmy(
  gameId: string,
  isHost: boolean,
  army: ArmyConfig,
): Promise<GameRow> {
  const field = isHost ? 'host_army' : 'guest_army';
  const { data, error } = await supabase
    .from('games')
    .update({ [field]: army })
    .eq('id', gameId)
    .select('*')
    .single();
  if (error) throw error;
  return data as GameRow;
}

export async function startGame(
  gameId: string,
  initialState: GameState,
  timePerTurnSeconds: number | null,
): Promise<GameRow> {
  const timeBank = timePerTurnSeconds !== null ? timePerTurnSeconds * 1000 : null;
  const { data, error } = await supabase
    .from('games')
    .update({
      status: 'active',
      game_state: initialState,
      host_time_ms: timeBank,
      guest_time_ms: timeBank,
      turn_started_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .select('*')
    .single();
  if (error) throw error;
  return data as GameRow;
}

// Writes the new game state. If timer is active and the turn changed,
// deducts elapsed time from the player who just moved and resets the
// turn timer. activeBankBeforeMove is what their time bank was when
// their turn began (so we can deduct elapsed seconds from it).
export async function writeGameState(
  gameId: string,
  state: GameState,
  timerUpdate?: {
    activePlayerWasHost: boolean;
    activeBankAfterMove: number; // ms remaining for the player whose turn ended
    turnChanged: boolean;
  },
): Promise<void> {
  const update: Record<string, unknown> = {
    game_state: state,
    last_action_at: new Date().toISOString(),
  };
  if (timerUpdate?.turnChanged) {
    if (timerUpdate.activePlayerWasHost) {
      update.host_time_ms = timerUpdate.activeBankAfterMove;
    } else {
      update.guest_time_ms = timerUpdate.activeBankAfterMove;
    }
    update.turn_started_at = new Date().toISOString();
  }
  const { error } = await supabase.from('games').update(update).eq('id', gameId);
  if (error) throw error;
}

export async function timeoutLoss(gameId: string, winnerId: string): Promise<void> {
  const { error } = await supabase
    .from('games')
    .update({ status: 'finished', winner_id: winnerId })
    .eq('id', gameId);
  if (error) throw error;
}

export async function resignGame(gameId: string, winnerId: string): Promise<void> {
  const { error } = await supabase
    .from('games')
    .update({ status: 'finished', winner_id: winnerId })
    .eq('id', gameId);
  if (error) throw error;
}

export function subscribeToLobby(onChange: () => void) {
  const channel = supabase
    .channel('lobby_games')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'games', filter: 'status=eq.waiting' },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToGame(gameId: string, onChange: (row: GameRow) => void) {
  const channel = supabase
    .channel(`game_${gameId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
      (payload) => onChange(payload.new as GameRow),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
