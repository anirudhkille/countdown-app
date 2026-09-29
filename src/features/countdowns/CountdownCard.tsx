import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgressRing } from '../../ui/ProgressRing';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

function formatTargetDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function CountdownCard({
  countdown,
  now,
  onPress,
  style,
}: {
  countdown: Countdown;
  now: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const occurrence = useMemo(
    () => resolveOccurrence(countdown.targetDate, countdown.recurrence, now, countdown.anchorDay),
    [countdown, now]
  );

  const value = useMemo(
    () =>
      calculateCountdown({
        occurrence,
        now,
        direction: countdown.direction,
        unit: countdown.unit,
        anchorDay: countdown.anchorDay,
      }),
    [countdown, occurrence, now]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${countdown.title}, ${value.value} ${value.unit}`}
      onPress={onPress}
      style={style}
    >
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.topRow}>
          <Text style={[typography.caption, styles.date, { color: theme.textMuted }]}>
            {formatTargetDate(occurrence)}
          </Text>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.textMuted} />
        </View>
        <ProgressRing value={value} direction={countdown.direction} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  date: { fontSize: 15 },
});
