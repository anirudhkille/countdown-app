import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radius, spacing, typography } from './tokens';
import { useTheme } from './ThemeProvider';

export interface SelectOption {
  value: string;
  label: string;
  /** Render the option label in this font, used to preview a typeface. */
  fontFamily?: string;
}

export function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (next: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${current?.label ?? 'not set'}`}
        accessibilityHint="Opens a list of options"
        onPress={() => setOpen(true)}
        style={[
          styles.row,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[typography.body, styles.rowLabel, { color: theme.text }]}>{label}</Text>
        <View style={styles.rowValue}>
          <Text
            style={[
              typography.body,
              { color: theme.textMuted },
              current?.fontFamily ? { fontFamily: current.fontFamily } : null,
            ]}
          >
            {current?.label ?? '—'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          <Pressable
            accessibilityViewIsModal
            style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[typography.label, styles.sheetTitle, { color: theme.textMuted }]}>
              {label}
            </Text>
            <ScrollView>
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={styles.option}
                  >
                    <Text
                      style={[
                        typography.body,
                        styles.optionLabel,
                        { color: selected ? theme.accent : theme.text },
                        option.fontFamily ? { fontFamily: option.fontFamily } : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? theme.accent : theme.textMuted}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1 },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    maxHeight: '70%',
  },
  sheetTitle: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionLabel: { flex: 1 },
});
