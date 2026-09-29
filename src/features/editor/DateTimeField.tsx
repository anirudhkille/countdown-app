import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { radius, spacing, typography } from '../../ui/tokens';
import type { Theme } from '../../ui/themes';

export function DateTimeField({
  theme,
  value,
  showTime,
  onChange,
}: {
  theme: Theme;
  value: Date;
  showTime: boolean;
  onChange: (next: Date) => void;
}) {
  const [mode, setMode] = React.useState<'date' | 'time'>('date');

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setMode('date');
    if (event.type === 'dismissed' || !selected) return;
    onChange(selected);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode('date')}
          style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}
        >
          <Text style={[typography.body, { color: theme.text }]}>
            {value.toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </Pressable>
        {showTime ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode('time')}
            style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}
          >
            <Text style={[typography.body, { color: theme.text }]}>
              {value.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {mode === 'date' ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      ) : (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
