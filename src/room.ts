import { getApps, initializeApp } from 'firebase/app';
import {
  getDatabase,
  onChildAdded,
  onChildChanged,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
  type Database,
} from 'firebase/database';

import { firebaseConfig } from './config';

// One table = one node in Firebase Realtime Database, rooms/{CODE}:
//   players/{id}  who is sitting at the table and whose phone is face down (removed on disconnect)
//   state         the game state, written only by the host
//   lifts/{round} the first pick-up of each round; a transaction plus the database rules make sure
//                 only the first one sticks, so every phone sees the same loser

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

let db: Database | null = null;

function getDb() {
  db ??= getDatabase(getApps()[0] ?? initializeApp(firebaseConfig));
  return db;
}

// Firebase drops empty objects and rejects undefined values, so normalize both ways.
function toDb<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function fromDb(value: Partial<GameState>): GameState {
  return { phase: 'lobby', round: 0, ...value, tally: value.tally ?? {} };
}

// create: this phone is opening a new table, so clear anything left over from an old table that
// happened to use the same code.
export function openRoom(code: string, me: Player, handlers: RoomHandlers, create: boolean): Room {
  const database = getDb();
  const roomRef = ref(database, `rooms/${code}`);
  const meRef = ref(database, `rooms/${code}/players/${me.id}`);
  let current = me;
  let connected = false;
  let closed = false;
  const unsubscribers: (() => void)[] = [];

  // (Re)announce ourselves every time the connection comes up, and leave automatically when it drops.
  const join = async () => {
    await onDisconnect(meRef).remove();
    await set(meRef, { name: current.name, ready: current.ready, joinedAt: serverTimestamp() });
  };

  const start = async () => {
    if (create) await remove(roomRef);
    if (closed) return;

    unsubscribers.push(
      onValue(ref(database, '.info/connected'), (snap) => {
        connected = snap.val() === true;
        handlers.onStatus(connected ? 'connected' : 'connecting');
        if (connected) join().catch(() => handlers.onStatus('error'));
      }),
      onValue(ref(database, `rooms/${code}/players`), (snap) => {
        const raw = (snap.val() ?? {}) as Record<string, Omit<Player, 'id'>>;
        handlers.onPlayers(
          Object.entries(raw).map(([id, p]) => ({ id, name: p.name, ready: p.ready, joinedAt: p.joinedAt })),
        );
      }),
      onValue(ref(database, `rooms/${code}/state`), (snap) => {
        if (snap.exists()) handlers.onMessage({ type: 'state', state: fromDb(snap.val()) });
      }),
    );
    const onLift = (snap: { key: string | null; val: () => { playerId: string; name: string } }) => {
      const { playerId, name } = snap.val();
      handlers.onMessage({ type: 'lift', round: Number(snap.key), playerId, name });
    };
    const liftsRef = ref(database, `rooms/${code}/lifts`);
    unsubscribers.push(onChildAdded(liftsRef, onLift), onChildChanged(liftsRef, onLift));
  };

  start().catch(() => handlers.onStatus('error'));

  return {
    update(next) {
      current = next;
      if (connected) update(meRef, { name: next.name, ready: next.ready }).catch(() => {});
    },
    send(message) {
      if (message.type === 'state') {
        set(ref(database, `rooms/${code}/state`), toDb(message.state)).catch(() => {});
      } else {
        const { round, playerId, name } = message;
        runTransaction(ref(database, `rooms/${code}/lifts/${round}`), (existing) => existing ?? { playerId, name }).catch(
          () => {},
        );
      }
    },
    close() {
      closed = true;
      unsubscribers.forEach((off) => off());
      onDisconnect(meRef).cancel().catch(() => {});
      remove(meRef).catch(() => {});
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
    // Lifts come straight back, as the database would confirm them.
    send(message) {
      if (message.type === 'lift') setTimeout(() => handlers.onMessage(message), 0);
    },
    close: () => {},
  };
}
