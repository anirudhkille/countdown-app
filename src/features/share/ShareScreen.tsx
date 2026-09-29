import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { getCountdown } from '../../data/countdownRepo';
import { resolveOccurrence } from '../../domain/recurrence';
import { calculateCountdown } from '../../domain/countdown';
import { useNow } from '../countdowns/useNow';
import type { Countdown } from '../../domain/types';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { buildShareText } from './shareText';
import { ShareCard } from './ShareCard';

export function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const viewRef = useRef<View>(null);
  const now = useNow();
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [busy, setBusy] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    let cancelled = false;
    void getCountdown(id).then((c) => {
      if (cancelled || !c) return;
      setCountdown(c);
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
    return calculateCountdown({
      occurrence,
      now,
      direction: countdown.direction,
      unit: countdown.unit,
      anchorDay: countdown.anchorDay,
    });
  }, [countdown, now]);

  useEffect(() => {
    if (countdown === null) router.back();
  }, [countdown, router]);

  async function shareText() {
    if (!countdown || !resolved) return;
    await Share.share({ message: buildShareText(countdown, resolved) });
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
        dialogTitle: countdown.title,
      });
    } catch (error) {
      Alert.alert('Could not share image', String(error));
    } finally {
      setBusy(false);
    }
  }

  if (!countdown || !resolved) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.previewWrap} pointerEvents="none">
        <View ref={viewRef} collapsable={false}>
          <ShareCard countdown={countdown} value={resolved} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void shareImage()}
          style={[styles.primary, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
        >
          <Text style={[typography.title, { color: theme.accentText }]}>
            {busy ? 'Preparing…' : 'Share as image'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void shareText()}
          style={[styles.secondary, { borderColor: theme.border }]}
        >
          <Text style={[typography.body, { color: theme.text }]}>Share as text</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewWrap: { alignItems: 'center', paddingTop: spacing.xl },
  actions: { gap: spacing.sm },
  primary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
