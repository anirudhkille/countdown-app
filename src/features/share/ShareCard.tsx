import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFontFamily, useTheme } from '../../ui/ThemeProvider';
import { radius, spacing, typography } from '../../ui/tokens';
import { formatCountdownValue, formatUnitLabel } from '../../domain/format';
import type { Countdown, CountdownValue } from '../../domain/types';

export function ShareCard({
  countdown,
  value,
}: {
  countdown: Countdown;
  value: CountdownValue;
}) {
  const theme = useTheme();
  const font = useFontFamily();
  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <Text style={[typography.label, { color: theme.textMuted }]}>
        {countdown.emoji ? `${countdown.emoji} ` : ''}
        {countdown.title}
      </Text>
      <Text
        style={[
          typography.hero,
          { color: countdown.color ?? theme.accent },
          font ? { fontFamily: font } : null,
        ]}
      >
        {formatCountdownValue(value.value)}
      </Text>
      <Text style={[typography.body, { color: theme.textMuted }]}>
        {formatUnitLabel(value.unit, value.value, countdown.direction)}
      </Text>
      <View style={[styles.rule, { backgroundColor: theme.border }]} />
      <Text style={[typography.caption, { color: theme.textMuted }]}>
        {new Date(countdown.targetDate).toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    height: 360,
    padding: spacing.lg,
    borderRadius: radius.lg,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  rule: { height: 1, marginVertical: spacing.md },
});
