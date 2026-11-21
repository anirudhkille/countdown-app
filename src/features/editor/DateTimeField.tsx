import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { FormDivider, FormRow } from '../../ui/FieldRow';

type PickerMode = 'date' | 'time';

export function DateTimeField({
  value,
  showTime,
  onChange,
}: {
  value: Date;
  showTime: boolean;
  onChange: (next: Date) => void;
}) {
  const [open, setOpen] = useState<PickerMode | null>(null);

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type !== 'dismissed' && selected) onChange(selected);
    setOpen(null);
  };

  const dateText = value.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeText = value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <View>
      <FormRow
        label="Date"
        value={dateText}
        onPress={() => setOpen((current) => (current === 'date' ? null : 'date'))}
      />
      {showTime ? (
        <>
          <FormDivider />
          <FormRow
            label="Time"
            value={timeText}
            onPress={() => setOpen((current) => (current === 'time' ? null : 'time'))}
          />
        </>
      ) : null}

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
