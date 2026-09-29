import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../ui/Card';
import { CountdownText } from '../../ui/CountdownText';
import { getTheme } from '../../ui/themes';
import { spacing, typography } from '../../ui/tokens';
import { fontFamilyFor } from '../../ui/fonts';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

export function CountdownCard({
  countdown,
  now,
  onPress,
}: {
  countdown: Countdown;
  now: number;
  onPress: () => void;
}) {
  const router = useRouter();
  const theme = getTheme(countdown.themeId);

  const value = useMemo(() => {
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

  const target = new Date(
    resolveOccurrence(countdown.targetDate, countdown.recurrence, now, countdown.anchorDay)
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={() => router.push(`/share/${countdown.id}`)}
    >
      <Card theme={theme}>
        <Text style={[typography.label, { color: theme.textMuted }]}>
          {countdown.emoji ? `${countdown.emoji} ` : ''}
          {countdown.title}
        </Text>
        <CountdownText
          theme={theme}
          value={value}
          direction={countdown.direction}
          fontFamily={fontFamilyFor(countdown.fontFamily)}
          color={countdown.color}
        />
        <Text style={[typography.caption, styles.target, { color: theme.textMuted }]}>
          {target.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
          {countdown.recurrence !== 'none'
            ? ` · every ${countdown.recurrence.slice(0, -2)}`
            : ''}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { marginTop: spacing.sm },
});
