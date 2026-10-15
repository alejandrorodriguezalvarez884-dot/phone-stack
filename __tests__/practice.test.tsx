import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import App from '../App';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// No accelerometer, like the simulator: the "Simulate" buttons stand in for the sensor.
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: () => Promise.resolve(false),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  useAudioPlayer: () => ({ seekTo: jest.fn(() => Promise.resolve()), play: jest.fn(), pause: jest.fn() }),
}));
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));
// Practice mode never touches the network.
jest.mock('firebase/app', () => ({ getApps: () => [], initializeApp: jest.fn() }));
jest.mock('firebase/database', () => ({}));

describe('practice mode', () => {
  beforeEach(() => AsyncStorage.clear());

  it('plays a full solo round', async () => {
    await render(<App />);

    const practice = await screen.findByText('Practice solo');
    await fireEvent.changeText(screen.getByPlaceholderText('What the table calls you'), '  Ana  ');
    await fireEvent.press(practice);

    await fireEvent.press(await screen.findByText('Start round'));
    expect(await screen.findByText('Phone face down')).toBeTruthy();

    await fireEvent.press(await screen.findByText('Simulate face down'));
    expect(await screen.findByText('Nobody touch it')).toBeTruthy();

    await fireEvent.press(screen.getByText('Simulate pick up'));
    expect(await screen.findByText('You’re paying!')).toBeTruthy();
    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('Penalty')).toBeTruthy();

    await fireEvent.press(screen.getByText('Silence'));
    await waitFor(() => expect(screen.queryByText('Silence')).toBeNull());

    await fireEvent.press(screen.getByText('Next round'));
    expect(await screen.findByText('Phone face down')).toBeTruthy();

    await fireEvent.press(screen.getByText('Leave'));
    expect(await screen.findByText('Practice solo')).toBeTruthy();
    expect(screen.getByDisplayValue('Ana')).toBeTruthy();
  }, 30_000);

  it('needs a name before playing', async () => {
    await render(<App />);
    const practice = await screen.findByText('Practice solo');
    await fireEvent.press(practice);
    expect(screen.queryByText('Start round')).toBeNull();
  });
});
