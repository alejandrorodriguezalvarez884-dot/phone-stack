import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const INTERVAL_MS = 50;
// z (in g) pointing out of the screen towards the table. Above ENTER the phone counts as face down
// once it has stayed there for SETTLE_MS; it stops counting below EXIT.
const FACE_DOWN_ENTER = 0.85;
const FACE_DOWN_EXIT = 0.7;
const SETTLE_MS = 600;
// While armed: tilting this far from the resting position for LIFT_SAMPLES readings in a row is a
// pick-up. Several readings so a bump on the table does not count.
const LIFT_ANGLE_DEG = 25;
const LIFT_SAMPLES = 3;
const LIFT_COS = Math.cos((LIFT_ANGLE_DEG * Math.PI) / 180);

// expo-sensors passes through each platform's sign: lying face up, iOS reads z ≈ -1 g and Android
// z ≈ +1 g. Flip so "towards the table when face down" is positive on both.
const DOWN_SIGN = Platform.OS === 'ios' ? 1 : -1;

type Vec = { x: number; y: number; z: number };

type Options = {
  // Read the sensor at all (placing or armed).
  watching: boolean;
  // Round is live: any pick-up calls onLift (once per arming).
  armed: boolean;
  onLift: () => void;
};

export function useFaceDown({ watching, armed, onLift }: Options) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [faceDown, setFaceDown] = useState(false);
  const onLiftRef = useRef(onLift);
  const armedRef = useRef(armed);
  useEffect(() => {
    onLiftRef.current = onLift;
    armedRef.current = armed;
  });

  useEffect(() => {
    // On web the sensor reports as available on desktops too, then fails; the tap fallback is used there.
    (Platform.OS === 'web' ? Promise.resolve(false) : Accelerometer.isAvailableAsync())
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  // Per-arming state, reset whenever the round is (re)armed.
  const baseline = useRef<Vec | null>(null);
  const tilted = useRef(0);
  const fired = useRef(false);
  useEffect(() => {
    baseline.current = null;
    tilted.current = 0;
    fired.current = false;
  }, [armed]);

  const fireLift = useCallback(() => {
    if (!armedRef.current || fired.current) return;
    fired.current = true;
    onLiftRef.current();
  }, []);

  useEffect(() => {
    if (!watching || !available) return;
    let downSince: number | null = null;
    // null until the first reading decides, so a stale value from the last session gets corrected.
    let isDown: boolean | null = null;
    let smooth: Vec | null = null;

    Accelerometer.setUpdateInterval(INTERVAL_MS);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      // Light low-pass filter to tame vibration from the table.
      smooth = smooth
        ? { x: (smooth.x + x) / 2, y: (smooth.y + y) / 2, z: (smooth.z + z) / 2 }
        : { x, y, z };

      const down = smooth.z * DOWN_SIGN;
      const now = Date.now();
      if (isDown !== true && down > FACE_DOWN_ENTER) {
        downSince ??= now;
        if (now - downSince >= SETTLE_MS) {
          isDown = true;
          setFaceDown(true);
        }
      } else {
        if (down <= FACE_DOWN_ENTER) downSince = null;
        if (down < FACE_DOWN_EXIT && isDown !== false) {
          isDown = false;
          setFaceDown(false);
        }
      }

      if (!armedRef.current || fired.current) return;
      const len = Math.hypot(smooth.x, smooth.y, smooth.z) || 1;
      const unit = { x: smooth.x / len, y: smooth.y / len, z: smooth.z / len };
      if (!baseline.current) {
        baseline.current = unit;
        return;
      }
      const b = baseline.current;
      const cos = unit.x * b.x + unit.y * b.y + unit.z * b.z;
      tilted.current = cos < LIFT_COS ? tilted.current + 1 : 0;
      if (tilted.current >= LIFT_SAMPLES) fireLift();
    });

    return () => sub.remove();
  }, [watching, available, fireLift]);

  // For devices without a sensor (web, emulators): tap instead of flipping.
  const simulateDown = useCallback(() => setFaceDown(true), []);
  const simulateLift = useCallback(() => {
    setFaceDown(false);
    fireLift();
  }, [fireLift]);

  return { available, faceDown: watching && faceDown, simulateDown, simulateLift };
}
