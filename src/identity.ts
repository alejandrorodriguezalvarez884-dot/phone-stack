import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Identity } from './useGame';

const KEY = 'phone-stack:identity';

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// A random id per install plus the last name used, so the name field comes pre-filled next dinner.
export async function loadIdentity(): Promise<Identity> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Identity>;
      if (saved.id) return { id: saved.id, name: saved.name ?? '' };
    }
  } catch {
    // Fall through to a fresh identity.
  }
  return { id: newId(), name: '' };
}

export function saveIdentity(identity: Identity) {
  AsyncStorage.setItem(KEY, JSON.stringify(identity)).catch(() => {});
}
