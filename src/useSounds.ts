import { useEffect } from 'react';
import { Vibration } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const ALARM = require('../assets/sounds/alarm.wav');
const ARMED = require('../assets/sounds/armed.wav');
const ALARM_VIBRATION = [0, 500, 250];

export function useSounds({ alarm, armed }: { alarm: boolean; armed: boolean }) {
  const alarmPlayer = useAudioPlayer(ALARM);
  const armedPlayer = useAudioPlayer(ARMED);

  useEffect(() => {
    // Ring even with the iPhone silent switch on, over any music that is playing.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!alarm) return;
    alarmPlayer.seekTo(0).then(() => alarmPlayer.play()).catch(() => {});
    Vibration.vibrate(ALARM_VIBRATION, true);
    return () => {
      alarmPlayer.pause();
      Vibration.cancel();
    };
  }, [alarm, alarmPlayer]);

  // Round is live: short beep so everyone knows, phones face down, without looking.
  useEffect(() => {
    if (!armed) return;
    armedPlayer.seekTo(0).then(() => armedPlayer.play()).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [armed, armedPlayer]);
}
