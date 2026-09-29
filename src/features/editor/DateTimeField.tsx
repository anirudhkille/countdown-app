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
  label = 'Select a date',
}: {
  theme: Theme;
  value: Date;
  showTime: boolean;
  onChange: (next: Date) => void;
  label?: string;
}) {
  // The picker must only be mounted while the user is actively choosing. Rendering it
  // unconditionally mounts the native Android dialog permanently, where it captures
  // every touch in the screen, and on iOS the inline calendar expands into the layout.
  const [open, setOpen] = useState<PickerMode | null>(null);

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type !== 'dismissed' && selected) onChange(selected);
    setOpen(null);
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateText = `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
  const timeText = value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const chip = (mode: PickerMode, text: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mode === 'date' ? label : 'Select a time'}
      accessibilityState={{ expanded: open === mode }}
      onPress={() => setOpen((current) => (current === mode ? null : mode))}
      style={[
        styles.chip,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
      ]}
    >
      <Text style={[typography.body, { color: theme.text }]}>{text}</Text>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Text style={[typography.body, { color: theme.text }]}>📅</Text>
      </View>
      <View style={styles.chips}>
        {chip('date', dateText)}
        {showTime ? chip('time', timeText) : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 28, alignItems: 'center' },
  chips: { flex: 1, flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
