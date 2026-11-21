import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressRing } from '../../ui/ProgressRing';
import { useTheme } from '../../ui/ThemeProvider';
import { radius, spacing, typography } from '../../ui/tokens';
import { formatCountdownValue, formatUnitLabel } from '../../domain/format';
import type { Countdown, CountdownValue } from '../../domain/types';

export function ShareCard({
  countdown,
  value,
  occurrence,
  size,
}: {
  countdown: Countdown;
  value: CountdownValue;
  occurrence: number;
  size: number;
}) {
  const theme = useTheme();
  const title = countdown.title.trim();

  return (
    <View
      style={[
        styles.card,
        {
          width: size,
          height: size,
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.top}>
        {countdown.recurrence !== 'none' ? (
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            Repeating countdown
          </Text>
        ) : null}
        <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
          {title || 'Countdown'}
        </Text>
      </View>

      <View style={styles.dial}>
        <ProgressRing
          value={value}
          direction={countdown.direction}
          size={Math.round(size * 0.46)}
          stroke={Math.round(size * 0.025)}
          color={countdown.color}
        />
      </View>

      <View style={styles.bottom}>
        <Text numberOfLines={1} style={[typography.body, { color: theme.text }]}>
          {new Date(occurrence).toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={[typography.caption, { color: theme.textMuted, flex: 1 }]}>
            {formatCountdownValue(value.value)}{' '}
            {formatUnitLabel(value.unit, value.value, countdown.direction)}
          </Text>
          <Text style={[typography.micro, { color: theme.textFaint }]}>Countdown</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
  },
  top: { gap: 4 },
  title: { fontSize: 24, lineHeight: 29, fontWeight: '600', letterSpacing: -0.5 },
  dial: { alignItems: 'center', justifyContent: 'center' },
  bottom: { gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
