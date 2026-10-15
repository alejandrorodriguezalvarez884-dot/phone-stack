import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { HomeScreen } from './src/components/HomeScreen';
import { RoomScreen } from './src/components/RoomScreen';
import { loadIdentity, saveIdentity } from './src/identity';
import { colors } from './src/theme';
import type { Identity } from './src/useGame';

type Table = { code: string; practice: boolean; create: boolean };

export default function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [table, setTable] = useState<Table | null>(null);

  useEffect(() => {
    loadIdentity().then(setIdentity);
  }, []);

  const leave = useCallback(() => setTable(null), []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        {identity &&
          (table ? (
            <RoomScreen
              code={table.code}
              practice={table.practice}
              create={table.create}
              identity={identity}
              onLeave={leave}
            />
          ) : (
            <HomeScreen
              initialName={identity.name}
              onEnter={({ code, practice, create, name }) => {
                const next = { ...identity, name };
                setIdentity(next);
                saveIdentity(next);
                setTable({ code, practice, create });
              }}
            />
          ))}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
