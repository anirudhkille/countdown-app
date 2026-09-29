import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../ui/Card';
import { CountdownText } from '../../ui/CountdownText';
import { spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

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
  const router = useRouter();
  const theme = useTheme();

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
      style={style}
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
