import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { t } from './i18n';
import {
  openLocalRoom,
  openRoom,
  type ConnectionStatus,
  type GameState,
  type Player,
  type Room,
  type RoomHandlers,
  type RoomMessage,
} from './room';
import { useFaceDown } from './useFaceDown';

export type Identity = { id: string; name: string };

type Lift = { round: number; playerId: string; name: string };

const INITIAL_STATE: GameState = { phase: 'lobby', round: 0, tally: {} };

// The host (whoever joined the table first) is the referee: it starts rounds, arms them when every
// phone is face down and decides who lifted first. Everyone else mirrors the host's state, so all
// phones agree on the loser even if two people grab their phones at almost the same time.
export function useGame({ code, identity, practice }: { code: string; identity: Identity; practice: boolean }) {
  const [joinedAt] = useState(() => Date.now());
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  // First pick-up seen in the current round. Sounds the alarm right away, before the host's verdict.
  const [firstLift, setFirstLift] = useState<Lift | null>(null);
  const room = useRef<Room | null>(null);

  const me: Player = useMemo(
    () => ({ id: identity.id, name: identity.name, joinedAt, ready: false }),
    [identity.id, identity.name, joinedAt],
  );

  useEffect(() => {
    const handlers: RoomHandlers = {
      onPlayers: setPlayers,
      onStatus: setStatus,
      onMessage: (message: RoomMessage) => {
        if (message.type === 'state') {
          setState((prev) => (message.state.round < prev.round ? prev : message.state));
        } else {
          setFirstLift((prev) => (prev && prev.round === message.round ? prev : message));
        }
      },
    };
    const opened = practice ? openLocalRoom(me, handlers) : openRoom(code, me, handlers);
    room.current = opened;
    return () => {
      opened.close();
      room.current = null;
    };
  }, [code, practice, me]);

  const sorted = useMemo(
    () => [...players].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id)),
    [players],
  );
  const hostId = practice ? identity.id : sorted[0]?.id;
  const isHost = hostId === identity.id;
  const minPlayers = practice ? 1 : 2;

  const publish = useCallback((next: GameState) => {
    setState(next);
    room.current?.send({ type: 'state', state: next });
  }, []);

  // --- Sensor ---
  const armed = state.phase === 'armed';
  const reportLift = useCallback(() => {
    const lift: Lift = { round: state.round, playerId: identity.id, name: identity.name };
    setFirstLift((prev) => (prev && prev.round === lift.round ? prev : lift));
    room.current?.send({ type: 'lift', ...lift });
  }, [state.round, identity.id, identity.name]);

  const sensor = useFaceDown({
    watching: state.phase === 'placing' || armed,
    armed,
    onLift: reportLift,
  });

  // Share whether our phone is face down; the host waits for everyone before arming.
  useEffect(() => {
    room.current?.update({ ...me, ready: sensor.faceDown });
  }, [me, sensor.faceDown]);

  // Leaving the app mid-round counts as picking the phone up.
  useEffect(() => {
    if (!armed) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') reportLift();
    });
    return () => sub.remove();
  }, [armed, reportLift]);

  // --- Host duties ---
  const playerIds = sorted.map((p) => p.id).join(',');
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Bring newcomers (and a new host's followers) up to date.
  useEffect(() => {
    if (isHost && !practice) room.current?.send({ type: 'state', state: stateRef.current });
  }, [isHost, practice, playerIds]);

  // Arm the round once every phone at the table is face down.
  useEffect(() => {
    if (!isHost || state.phase !== 'placing') return;
    if (players.length < minPlayers || !players.every((p) => p.ready)) return;
    // Host decisions are reactions to presence/messages from other phones; publishing them is the point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    publish({ ...state, phase: 'armed', roster: players.map(({ id, name }) => ({ id, name })) });
  }, [isHost, state, players, minPlayers, publish]);

  // Pick the loser: first lift message, or anyone from the armed roster whose phone stops being
  // face down or who drops off the table (in case their lift message never arrived).
  useEffect(() => {
    if (!isHost || state.phase !== 'armed') return;
    let loser: { id: string; name: string } | undefined;
    if (firstLift && firstLift.round === state.round) {
      loser = { id: firstLift.playerId, name: firstLift.name };
    } else {
      loser = state.roster?.find((r) => {
        const p = players.find((x) => x.id === r.id);
        return !p || !p.ready;
      });
    }
    if (!loser) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    publish({
      phase: 'result',
      round: state.round,
      loserId: loser.id,
      loserName: loser.name,
      penalty: Math.floor(Math.random() * t.penalties.length),
      tally: { ...state.tally, [loser.id]: (state.tally[loser.id] ?? 0) + 1 },
    });
  }, [isHost, state, firstLift, players, publish]);

  const startRound = useCallback(() => {
    publish({ phase: 'placing', round: state.round + 1, tally: state.tally });
  }, [publish, state.round, state.tally]);

  // Name to show while the alarm rings but the host has not ruled yet.
  const pendingLoser = armed && firstLift?.round === state.round ? firstLift.name : null;

  return {
    status,
    state,
    players: sorted,
    hostId,
    isHost,
    canStart: players.length >= minPlayers,
    pendingLoser,
    sensor,
    startRound,
  };
}
