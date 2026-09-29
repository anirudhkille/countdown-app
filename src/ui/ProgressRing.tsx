import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { typography } from './tokens';
import { useFontFamily, useTheme } from './ThemeProvider';
import { formatCountdownValue, formatUnitLabel } from '../domain/format';
import type { CountdownValue, Direction } from '../domain/types';

const SIZE = 150;
const STROKE = 12;
const DAYS_IN_CYCLE = 365;

/**
 * Circular countdown indicator.
 *
 * The arc is the fraction of the period already elapsed, so it fills as an event
 * approaches and is complete once it has passed. A count-up from a past date is
 * therefore always a full ring. Clamped because an event further out than one full
 * period would otherwise wrap past a full circle.
 */
export function ProgressRing({
  value,
  direction,
  size = SIZE,
  stroke = STROKE,
  showLabel = true,
}: {
  value: CountdownValue;
  direction: Direction;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}) {
  const theme = useTheme();
  const fontFamily = useFontFamily();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = direction === 'down' ? 1 - value.totalDays / DAYS_IN_CYCLE : 1;
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = circumference * clamped;
  const unit = formatUnitLabel(value.unit, value.value, direction).replace(/\s(left|since)$/, '');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={[
          styles.inner,
          {
            width: size - stroke * 2,
            height: size - stroke * 2,
            borderRadius: (size - stroke * 2) / 2,
            backgroundColor: theme.surface,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.number, { color: theme.text }, fontFamily ? { fontFamily } : null]}
        >
          {formatCountdownValue(value.value)}
        </Text>
        {showLabel ? (
          <Text numberOfLines={1} style={[typography.label, { color: theme.text }]}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 40, lineHeight: 46, fontWeight: '700' },
});
