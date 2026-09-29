import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { radius, spacing, typography } from '../../ui/tokens';
import type { Theme } from '../../ui/themes';

type PickerMode = 'date' | 'time';

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
  // The picker must only be mounted while the user is actively choosing. Rendering it
  // unconditionally mounts the native Android dialog permanently, where it captures
  // every touch in the screen, and on iOS the inline calendar expands into the layout.
  const [open, setOpen] = useState<PickerMode | null>(null);

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setOpen(null);
      return;
    }
    onChange(selected);
    setOpen(null);
  };

  const toggle = (mode: PickerMode) => setOpen((current) => (current === mode ? null : mode));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose date"
          accessibilityState={{ expanded: open === 'date' }}
          onPress={() => toggle('date')}
          style={[
            styles.chip,
            {
              backgroundColor: open === 'date' ? theme.accent : theme.surfaceAlt,
            },
          ]}
        >
          <Text
            style={[
              typography.body,
              { color: open === 'date' ? theme.accentText : theme.text },
            ]}
          >
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
            accessibilityLabel="Choose time"
            accessibilityState={{ expanded: open === 'time' }}
            onPress={() => toggle('time')}
            style={[
              styles.chip,
              {
                backgroundColor: open === 'time' ? theme.accent : theme.surfaceAlt,
              },
            ]}
          >
            <Text
              style={[
                typography.body,
                { color: open === 'time' ? theme.accentText : theme.text },
              ]}
            >
              {value.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {open === 'date' ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      ) : null}

      {open === 'time' ? (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      ) : null}
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
