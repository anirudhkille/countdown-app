import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFontFamily, useTheme } from './ThemeProvider';
import { formatCountdownValue, formatUnitLabel } from '../domain/format';
import type { CountdownValue, Direction } from '../domain/types';

const DEFAULT_SIZE = 128;
const DEFAULT_STROKE = 9;
const DRAIN_WINDOW_DAYS = 30;

export function ProgressRing({
  value,
  direction,
  size = DEFAULT_SIZE,
  stroke = DEFAULT_STROKE,
  color,
  showLabel = true,
  remaining,
}: {
  value: CountdownValue;
  direction: Direction;
  size?: number;
  stroke?: number;
  color?: string | null;
  showLabel?: boolean;
  remaining?: number;
}) {
  const theme = useTheme();
  const fontFamily = useFontFamily();

  const center = size / 2;
  const tickRadius = center - 1.5;
  const radius = center - 5.5 - stroke / 2;
  const circumference = 2 * Math.PI * radius;

  const progress =
    direction === 'down'
      ? Math.max(0, Math.min(1, remaining ?? value.totalDays / DRAIN_WINDOW_DAYS))
      : 1;
  const dash = circumference * progress;

  const unit = formatUnitLabel(value.unit, value.value, direction, value.isPast).replace(
    /\s(left|since)$/,
    ''
  );
  const ink = color ?? theme.accent;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={tickRadius}
          stroke={theme.textFaint}
          strokeWidth={1.5}
          strokeDasharray="1.5 4.5"
          fill="none"
          opacity={0.7}
        />
        <Circle cx={center} cy={center} r={radius} stroke={theme.track} strokeWidth={2} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.inner} pointerEvents="none">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.45}
          style={[
            styles.number,
            { color: theme.text, fontSize: size * 0.3, lineHeight: size * 0.34 },
            fontFamily ? { fontFamily } : styles.systemWeight,
          ]}
        >
          {formatCountdownValue(value.value)}
        </Text>
        {showLabel ? (
          <Text
            numberOfLines={1}
            style={[
              styles.unit,
              { color: theme.textMuted, fontSize: Math.max(9, size * 0.095) },
            ]}
          >
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
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  number: { letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  systemWeight: { fontWeight: '700' },
  unit: { fontWeight: '500', marginTop: -1, letterSpacing: 0.2 },
});
