import 'react-native-url-polyfill/auto';
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_KEY, SUPABASE_URL } from './config';

// One table = one Supabase Realtime channel. Presence lists who is sitting at the table (and whose
// phone is face down); broadcast carries the game messages. No database tables are involved.

export type Player = {
  id: string;
  name: string;
  joinedAt: number;
  // Phone is face down and still. Kept in presence so the host knows when to start the round.
  ready: boolean;
};

export type GameState = {
  phase: 'lobby' | 'placing' | 'armed' | 'result';
  round: number;
  // Set in 'armed': who was face down when the round started.
  roster?: { id: string; name: string }[];
  // Set in 'result'.
  loserId?: string;
  loserName?: string;
  penalty?: number;
  // Losses per player id, carried in every state so a new host can pick up the count.
  tally: Record<string, number>;
};

export type RoomMessage =
  // The host is the only one who sends this; everyone else mirrors it.
  | { type: 'state'; state: GameState }
  // Anyone whose phone gets picked up during an armed round.
  | { type: 'lift'; round: number; playerId: string; name: string };

export type ConnectionStatus = 'connecting' | 'connected' | 'error';

export type RoomHandlers = {
  onPlayers: (players: Player[]) => void;
  onMessage: (message: RoomMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
};

export type Room = {
  // Publishes our presence (name, ready flag).
  update: (me: Player) => void;
  // Sends to everyone else. The sender applies its own messages locally.
  send: (message: RoomMessage) => void;
  close: () => void;
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 4;

export function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

export function normalizeCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}

let client: SupabaseClient | null = null;

function getClient() {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

export function openRoom(code: string, me: Player, handlers: RoomHandlers): Room {
  const channel: RealtimeChannel = getClient().channel(`phone-stack:${code}`, {
    config: { broadcast: { self: false }, presence: { key: me.id } },
  });
  let current = me;
  let joined = false;
  let closed = false;

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState<Player>();
    // A player has one entry per connection; keep the newest.
    const players = Object.values(state)
      .map((entries) => entries[entries.length - 1])
      .filter((p): p is Player & { presence_ref: string } => !!p)
      .map(({ id, name, joinedAt, ready }) => ({ id, name, joinedAt, ready }));
    handlers.onPlayers(players);
  });

  channel.on('broadcast', { event: 'msg' }, ({ payload }) => handlers.onMessage(payload as RoomMessage));

  channel.subscribe((status) => {
    if (closed) return;
    if (status === 'SUBSCRIBED') {
      joined = true;
      handlers.onStatus('connected');
      channel.track(current);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      joined = false;
      handlers.onStatus('error');
    }
  });

  return {
    update(next) {
      current = next;
      if (joined) channel.track(next);
    },
    send(message) {
      if (joined) channel.send({ type: 'broadcast', event: 'msg', payload: message });
    },
    close() {
      closed = true;
      getClient().removeChannel(channel);
    },
  };
}

// Practice mode: a table with only you, nothing leaves the phone.
export function openLocalRoom(me: Player, handlers: RoomHandlers): Room {
  let current = me;
  setTimeout(() => {
    handlers.onStatus('connected');
    handlers.onPlayers([current]);
  }, 0);
  return {
    update(next) {
      current = next;
      handlers.onPlayers([next]);
    },
    send: () => {},
    close: () => {},
  };
}
