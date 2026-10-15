import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasBackend } from '../config';
import { t } from '../i18n';
import { CODE_LENGTH, normalizeCode, randomCode } from '../room';
import { colors, maxScale } from '../theme';
import { Button, Card, Logo } from './ui';

type Props = {
  initialName: string;
  onEnter: (table: { code: string; practice: boolean; create: boolean; name: string }) => void;
};

const MAX_NAME = 20;

export function HomeScreen({ initialName, onEnter }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState('');
  const trimmed = name.trim();
  const canPlay = trimmed.length > 0;
  const canJoin = canPlay && code.length === CODE_LENGTH;
  const join = () => {
    if (canJoin) onEnter({ code, practice: false, create: false, name: trimmed });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Logo size={88} />
          <Text maxFontSizeMultiplier={maxScale.display} style={styles.title}>{t.appName}</Text>
          <Text maxFontSizeMultiplier={maxScale.heading} style={styles.tagline}>{t.tagline}</Text>
        </View>

        <Card style={styles.form}>
          <Text maxFontSizeMultiplier={maxScale.heading} style={styles.label}>{t.yourName}</Text>
          <TextInput
            value={name}
            onChangeText={(v) => setName(v.slice(0, MAX_NAME))}
            placeholder={t.namePlaceholder}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            maxFontSizeMultiplier={maxScale.heading}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
          />

          {hasBackend ? (
            <>
              <Button
                label={t.createTable}
                disabled={!canPlay}
                onPress={() => onEnter({ code: randomCode(), practice: false, create: true, name: trimmed })}
              />
              <View style={styles.joinRow}>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(normalizeCode(v))}
                  placeholder={t.codePlaceholder}
                  placeholderTextColor={colors.textFaint}
                  style={[styles.input, styles.codeInput]}
                  maxFontSizeMultiplier={maxScale.display}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={CODE_LENGTH}
                  returnKeyType="join"
                  onSubmitEditing={join}
                />
                <Button
                  label={t.joinTable}
                  variant="secondary"
                  disabled={!canJoin}
                  onPress={join}
                  style={styles.joinButton}
                />
              </View>
            </>
          ) : (
            <Text maxFontSizeMultiplier={maxScale.body} style={styles.note}>{t.noBackend}</Text>
          )}

          <Button
            label={t.practice}
            variant="secondary"
            disabled={!canPlay}
            onPress={() => onEnter({ code: '', practice: true, create: false, name: trimmed })}
          />
        </Card>

        <Card>
          <Text maxFontSizeMultiplier={maxScale.heading} style={styles.howTitle}>{t.howTitle}</Text>
          {t.howSteps.map((step, i) => (
            <View key={step} style={styles.step}>
              <Text maxFontSizeMultiplier={1} style={styles.stepNumber}>{i + 1}</Text>
              <Text maxFontSizeMultiplier={maxScale.body} style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  tagline: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    gap: 12,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.text,
    fontSize: 17,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
  },
  joinButton: {
    minWidth: 110,
  },
  note: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  howTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    color: colors.white,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
});
