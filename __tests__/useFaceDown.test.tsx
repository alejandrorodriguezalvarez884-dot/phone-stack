import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Accelerometer } from 'expo-sensors';

import { useFaceDown } from '../src/useFaceDown';

type Reading = { x: number; y: number; z: number };

jest.mock('expo-sensors', () => {
  const listeners: ((r: { x: number; y: number; z: number }) => void)[] = [];
  return {
    Accelerometer: {
      isAvailableAsync: jest.fn(() => Promise.resolve(true)),
      setUpdateInterval: jest.fn(),
      addListener: jest.fn((cb: (r: { x: number; y: number; z: number }) => void) => {
        listeners.push(cb);
        return { remove: () => listeners.splice(listeners.indexOf(cb), 1) };
      }),
      __emit: (r: { x: number; y: number; z: number }) => listeners.forEach((cb) => cb(r)),
    },
  };
});

const emit = (r: Reading) => (Accelerometer as unknown as { __emit: (r: Reading) => void }).__emit(r);

// iOS reports z = -1 g lying face up, so +1 g is face down.
const FACE_UP = { x: 0, y: 0, z: -1 };
const FACE_DOWN = { x: 0, y: 0, z: 1 };
const TILTED = { x: 0, y: 0.7, z: 0.7 };

describe('useFaceDown', () => {
  let now = 0;
  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });
  afterEach(() => jest.restoreAllMocks());

  const feed = (r: Reading, times: number, stepMs = 50) =>
    act(() => {
      for (let i = 0; i < times; i++) {
        now += stepMs;
        emit(r);
      }
    });

  it('reports face down only after the phone settles', async () => {
    const { result } = await renderHook(() => useFaceDown({ watching: true, armed: false, onLift: jest.fn() }));
    await waitFor(() => expect(result.current.available).toBe(true));

    await feed(FACE_UP, 5);
    expect(result.current.faceDown).toBe(false);
    await feed(FACE_DOWN, 5);
    expect(result.current.faceDown).toBe(false);
    await feed(FACE_DOWN, 20);
    expect(result.current.faceDown).toBe(true);
    await feed(FACE_UP, 3);
    expect(result.current.faceDown).toBe(false);
  });

  it('calls onLift once when the armed phone is tilted', async () => {
    const onLift = jest.fn();
    const { result } = await renderHook(() => useFaceDown({ watching: true, armed: true, onLift }));
    await waitFor(() => expect(result.current.available).toBe(true));

    await feed(FACE_DOWN, 20);
    // A single bump does not count.
    await feed(TILTED, 1);
    await feed(FACE_DOWN, 5);
    expect(onLift).not.toHaveBeenCalled();

    await feed(TILTED, 10);
    await feed(FACE_UP, 10);
    expect(onLift).toHaveBeenCalledTimes(1);
  });

  it('does not fire while not armed', async () => {
    const onLift = jest.fn();
    const { result } = await renderHook(() => useFaceDown({ watching: true, armed: false, onLift }));
    await waitFor(() => expect(result.current.available).toBe(true));
    await feed(FACE_DOWN, 20);
    await feed(FACE_UP, 20);
    expect(onLift).not.toHaveBeenCalled();
  });
});
