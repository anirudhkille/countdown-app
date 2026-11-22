import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCountdown } from '../../data/countdownRepo';
import { resolveOccurrence } from '../../domain/recurrence';
import { calculateCountdown } from '../../domain/countdown';
import { useNow } from '../countdowns/useNow';
import type { Countdown } from '../../domain/types';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { StackHeader } from '../../ui/StackHeader';
import { buildShareText } from './shareText';
import { ShareCard } from './ShareCard';

export function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const viewRef = useRef<View>(null);
  const now = useNow();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [busy, setBusy] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    let cancelled = false;
    void getCountdown(id)
      .then((c) => {
        if (cancelled) return;
        if (!c) {
          setStatus('missing');
          return;
        }
        setCountdown(c);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const resolved = useMemo(() => {
    if (!countdown) return null;
    const occurrence = resolveOccurrence(
      countdown.targetDate,
      countdown.recurrence,
      now,
      countdown.anchorDay
    );
    return {
      occurrence,
      value: calculateCountdown({
        occurrence,
        now,
        direction: countdown.direction,
        unit: countdown.unit,
        anchorDay: countdown.anchorDay,
      }),
    };
  }, [countdown, now]);

  useEffect(() => {
    if (countdown === null) router.back();
  }, [countdown, router]);

  async function shareText() {
    if (!countdown || !resolved) return;
    await Share.share({
      message: buildShareText(countdown, resolved.value, resolved.occurrence),
    });
  }

  async function shareImage() {
    if (!countdown || !resolved || !viewRef.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(viewRef, { format: 'png', quality: 1 });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'This device cannot share images.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: countdown.title || 'Countdown',
      });
    } catch (error) {
      Alert.alert('Could not share image', String(error));
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StackHeader title="Share" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </View>
    );
  }

  if (status === 'missing' || !countdown || !resolved) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <StackHeader title="Share" />
        <View style={styles.center}>
          <Text style={[typography.title, styles.missingTitle, { color: theme.text }]}>
            Countdown not found
          </Text>
          <Text style={[typography.body, styles.missingBody, { color: theme.textMuted }]}>
            It may have been deleted on this device.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [
              styles.missingButton,
              { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[typography.body, { color: theme.text }]}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const cardSize = Math.min(width - spacing.lg * 2, height * 0.56, 400);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StackHeader title="Share" />
      <View style={styles.container}>
        <View style={styles.previewWrap} pointerEvents="none">
          <View
            ref={viewRef}
            collapsable={false}
            style={styles.capture}
          >
            <ShareCard
              countdown={countdown}
              value={resolved.value}
              occurrence={resolved.occurrence}
              size={cardSize}
              now={now}
            />
          </View>
        </View>

        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share as image"
            disabled={busy}
            onPress={() => void shareImage()}
            style={({ pressed }) => [
              styles.primary,
              {
                backgroundColor: theme.accent,
                opacity: busy ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[typography.bodyStrong, styles.primaryLabel, { color: theme.accentText }]}>
              {busy ? 'Preparing image…' : 'Share as image'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share as text"
            onPress={() => void shareText()}
            style={({ pressed }) => [
              styles.secondary,
              { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[typography.body, { color: theme.text }]}>Share as text</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  missingTitle: { textAlign: 'center' },
  missingBody: { textAlign: 'center', maxWidth: 300 },
  missingButton: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  capture: { backgroundColor: 'transparent' },
  actions: { gap: spacing.sm },
  primary: {
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontSize: 16 },
  secondary: {
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
