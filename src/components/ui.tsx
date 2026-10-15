import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, maxScale } from '../theme';

export const tap = () => Haptics.selectionAsync().catch(() => {});

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        !primary && styles.secondary,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {primary && (
        <LinearGradient
          colors={[colors.accent, colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradient]}
        />
      )}
      <Text maxFontSizeMultiplier={maxScale.control} style={[styles.label, !primary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Three phones piled up, the top one slightly crooked.
export function Logo({ size = 56 }: { size?: number }) {
  const w = size * 0.5;
  const h = size * 0.82;
  const phone = (rotate: string, offset: number, color: string) => (
    <View
      style={{
        position: 'absolute',
        width: w,
        height: h,
        borderRadius: w * 0.22,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: colors.backgroundBottom,
        transform: [{ translateX: offset }, { rotate }],
      }}
    />
  );
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {phone('-14deg', -size * 0.14, colors.gold)}
      {phone('10deg', size * 0.14, colors.accentDark)}
      {phone('0deg', 0, colors.accent)}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 16,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 20,
    padding: 16,
  },
});
