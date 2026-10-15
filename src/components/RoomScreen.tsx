import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';

import { t } from '../i18n';
import type { Player } from '../room';
import { colors } from '../theme';
import { useGame, type Identity } from '../useGame';
import { useSounds } from '../useSounds';
import { Button, Card, tap } from './ui';

type Props = {
  code: string;
  practice: boolean;
  identity: Identity;
  onLeave: () => void;
};

// The alarm stops on its own after this long, in case the phone stays face down. Matches the length
// of assets/sounds/alarm.wav (scripts/generate-sounds.mjs).
const ALARM_MAX_MS = 10_000;
const KEEP_AWAKE_TAG = 'phone-stack-room';

export function RoomScreen({ code, practice, identity, onLeave }: Props) {
  // Screen stays on at the table, otherwise the phone sleeps face down and stops reading the sensor.
  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);
  const game = useGame({ code, identity, practice });
  const { state, sensor } = game;

  // Ring from the first lift until silenced, the next round, or the timeout.
  const [silencedRound, setSilencedRound] = useState(-1);
  const triggered = game.pendingLoser !== null || state.phase === 'result';
  const ringing = triggered && silencedRound !== state.round;
  useSounds({ alarm: ringing, armed: state.phase === 'armed' && !game.pendingLoser });

  useEffect(() => {
    if (!ringing) return;
    const round = state.round;
    const id = setTimeout(() => setSilencedRound(round), ALARM_MAX_MS);
    return () => clearTimeout(id);
  }, [ringing, state.round]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onLeave();
      return true;
    });
    return () => sub.remove();
  }, [onLeave]);

  const share = () => {
    tap();
    Share.share({ message: t.shareMessage(code) }).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerLabel}>{practice ? t.practiceTitle : t.table}</Text>
          {!practice && <Text style={styles.code}>{code}</Text>}
        </View>
        {!practice && <HeaderButton label={t.share} onPress={share} />}
        <HeaderButton label={t.leave} onPress={onLeave} />
      </View>

      {game.status !== 'connected' && (
        <Text style={[styles.status, game.status === 'error' && styles.error]}>
          {game.status === 'error' ? t.connectionError : t.connecting}
        </Text>
      )}

      <Stage
        game={game}
        identityId={identity.id}
        practice={practice}
        ringing={ringing}
        onSilence={() => setSilencedRound(state.round)}
      />

      {sensor.available === false && (state.phase === 'placing' || state.phase === 'armed') && (
        <Card style={styles.simulate}>
          <Text style={styles.muted}>{t.sensorMissing}</Text>
          {state.phase === 'placing' ? (
            <Button label={t.simulateDown} variant="secondary" onPress={sensor.simulateDown} />
          ) : (
            <Button label={t.simulateLift} variant="secondary" onPress={sensor.simulateLift} />
          )}
        </Card>
      )}

      {!practice && (
        <PlayerList
          players={game.players}
          meId={identity.id}
          hostId={game.hostId}
          tally={state.tally}
          showReady={state.phase === 'placing'}
        />
      )}
    </ScrollView>
  );
}

type Game = ReturnType<typeof useGame>;

function Stage({
  game,
  identityId,
  practice,
  ringing,
  onSilence,
}: {
  game: Game;
  identityId: string;
  practice: boolean;
  ringing: boolean;
  onSilence: () => void;
}) {
  const { state } = game;

  if (state.phase === 'result' || game.pendingLoser) {
    const loserName = state.phase === 'result' ? state.loserName : game.pendingLoser;
    const isMe = state.phase === 'result' && state.loserId === identityId;
    return (
      <View style={styles.result}>
        <LinearGradient colors={[colors.accent, colors.accentDark]} style={StyleSheet.absoluteFill} />
        <Text style={styles.resultLabel}>{isMe ? t.youLose : state.phase === 'result' ? t.loserTitle : t.liftedTitle}</Text>
        <Text style={styles.loser} numberOfLines={2} adjustsFontSizeToFit>
          {loserName}
        </Text>
        {state.phase === 'result' && state.penalty !== undefined && (
          <View style={styles.penalty}>
            <Text style={styles.penaltyLabel}>{t.penaltyTitle}</Text>
            <Text style={styles.penaltyText}>{t.penalties[state.penalty]}</Text>
          </View>
        )}
        <View style={styles.resultActions}>
          {ringing && <Button label={t.silence} variant="secondary" onPress={onSilence} />}
          {state.phase === 'result' &&
            (game.isHost ? (
              <Button label={t.nextRound} variant="secondary" onPress={game.startRound} />
            ) : (
              <Text style={styles.resultWaiting}>{t.waitingHost}</Text>
            ))}
        </View>
      </View>
    );
  }

  if (state.phase === 'armed') {
    return (
      <Card style={styles.stage}>
        <Text style={styles.stageTitle}>{t.armedTitle}</Text>
        <Text style={styles.muted}>{t.armedHint}</Text>
      </Card>
    );
  }

  if (state.phase === 'placing') {
    const missing = game.players.filter((p) => !p.ready).map((p) => p.name);
    return (
      <Card style={styles.stage}>
        <PhoneGlyph down={game.sensor.faceDown} />
        <Text style={styles.stageTitle}>{t.placeTitle}</Text>
        <Text style={styles.muted}>{practice ? t.practiceHint : t.placeHint}</Text>
        {!practice && missing.length > 0 && <Text style={styles.missing}>{t.waitingFor(missing.join(', '))}</Text>}
      </Card>
    );
  }

  return (
    <Card style={styles.stage}>
      <Text style={styles.muted}>{game.isHost ? (practice ? t.practiceHint : t.lobbyHost) : t.lobbyGuest}</Text>
      {game.isHost && (
        <>
          <Button label={t.startRound} disabled={!game.canStart} onPress={game.startRound} />
          {!game.canStart && <Text style={styles.missing}>{t.needPlayers}</Text>}
        </>
      )}
    </Card>
  );
}

function PhoneGlyph({ down }: { down: boolean }) {
  return (
    <View style={[styles.glyph, down ? styles.glyphDown : styles.glyphUp]}>
      <View style={[styles.glyphScreen, down && styles.glyphScreenDown]} />
    </View>
  );
}

function PlayerList({
  players,
  meId,
  hostId,
  tally,
  showReady,
}: {
  players: Player[];
  meId: string;
  hostId: string | undefined;
  tally: Record<string, number>;
  showReady: boolean;
}) {
  const anyLosses = Object.keys(tally).length > 0;
  return (
    <Card>
      <Text style={styles.listTitle}>{anyLosses ? t.scoreboard : t.players}</Text>
      {players.map((p) => {
        const tags = [p.id === meId && t.you, p.id === hostId && t.host].filter(Boolean).join(' · ');
        const losses = tally[p.id] ?? 0;
        return (
          <View key={p.id} style={styles.player}>
            {showReady && <View style={[styles.dot, p.ready && styles.dotReady]} />}
            <Text style={styles.playerName} numberOfLines={1}>
              {p.name}
              {tags ? <Text style={styles.playerTags}>{`  ${tags}`}</Text> : null}
            </Text>
            {showReady ? (
              <Text style={[styles.playerMeta, p.ready && styles.ready]}>{p.ready ? t.ready : t.notReady}</Text>
            ) : (
              losses > 0 && <Text style={styles.playerMeta}>{t.losses(losses)}</Text>
            )}
          </View>
        );
      })}
    </Card>
  );
}

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.headerButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    flex: 1,
  },
  headerLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  code: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 6,
  },
  headerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerButtonLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  status: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    color: colors.error,
  },
  stage: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  stageTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  missing: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  simulate: {
    gap: 10,
  },
  glyph: {
    width: 56,
    height: 92,
    borderRadius: 14,
    borderWidth: 3,
    padding: 5,
    marginBottom: 4,
  },
  glyphUp: {
    borderColor: colors.textMuted,
    transform: [{ rotate: '-12deg' }],
  },
  glyphDown: {
    borderColor: colors.success,
    backgroundColor: 'rgba(91,227,139,0.15)',
  },
  glyphScreen: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.textFaint,
  },
  glyphScreenDown: {
    backgroundColor: 'transparent',
  },
  result: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  resultLabel: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    opacity: 0.9,
    textAlign: 'center',
  },
  loser: {
    color: colors.white,
    fontSize: 52,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  penalty: {
    alignSelf: 'stretch',
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  penaltyLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  penaltyText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  resultActions: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 8,
  },
  resultWaiting: {
    color: colors.white,
    opacity: 0.85,
    textAlign: 'center',
  },
  listTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textFaint,
  },
  dotReady: {
    backgroundColor: colors.success,
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  playerTags: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: '600',
  },
  playerMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  ready: {
    color: colors.success,
  },
});
