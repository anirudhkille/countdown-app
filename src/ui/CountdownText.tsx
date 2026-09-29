import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCountdownValue, formatUnitLabel } from '../domain/format';
import type { CountdownValue, Direction } from '../domain/types';
import { typography } from './tokens';
import type { Theme } from './themes';

export function CountdownText({
  theme,
  value,
  direction,
  fontFamily,
  color,
}: {
  theme: Theme;
  value: CountdownValue;
  direction: Direction;
  fontFamily?: string;
  color?: string | null;
}) {
  const tint = color ?? theme.accent;
  return (
    <View style={styles.wrap}>
      <Text style={[typography.hero, { color: tint }, fontFamily ? { fontFamily } : null]}>
        {formatCountdownValue(value.value)}
      </Text>
      <Text style={[typography.label, { color: theme.textMuted }]}>
        {formatUnitLabel(value.unit, value.value, direction)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
});
