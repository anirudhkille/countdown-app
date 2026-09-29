import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFontFamily, useTheme } from './ThemeProvider';
import { formatCountdownValue, formatUnitLabel } from '../domain/format';
import type { CountdownValue, Direction } from '../domain/types';

const DEFAULT_SIZE = 128;
const DEFAULT_STROKE = 11;
/** The ring only starts draining in the last stretch before the date. */
const DRAIN_WINDOW_DAYS = 30;

/**
 * Circular countdown indicator: a light disc punched out of the card, ringed by an
 * arc that stays full until the event is close and then drains to empty on the day.
 * A count-up from a past date has nothing left to drain, so it stays complete.
 */
export function ProgressRing({
  value,
  direction,
  size = DEFAULT_SIZE,
  stroke = DEFAULT_STROKE,
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
  const inner = size - stroke * 2;

  const progress =
    direction === 'down'
      ? Math.max(0, Math.min(1, value.totalDays / DRAIN_WINDOW_DAYS))
      : 1;
  const dash = circumference * progress;

  const unit = formatUnitLabel(value.unit, value.value, direction).replace(
    /\s(left|since)$/,
    ''
  );

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
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            top: stroke,
            left: stroke,
            backgroundColor: theme.ringInterior,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[
            styles.number,
            { color: theme.ringInk, fontSize: size * 0.3 },
            fontFamily ? { fontFamily } : null,
          ]}
        >
          {formatCountdownValue(value.value)}
        </Text>
        {showLabel ? (
          <Text numberOfLines={1} style={[styles.unit, { color: theme.ringInk }]}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontWeight: '700', letterSpacing: -1, lineHeight: undefined },
  unit: { fontSize: 15, fontWeight: '600', marginTop: -2 },
});
