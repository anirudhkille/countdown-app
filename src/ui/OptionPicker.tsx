import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radius, spacing, typography } from './tokens';
import { useTheme } from './ThemeProvider';

export interface PickerOption {
  value: string;
  label: string;
  fontFamily?: string;
}

/** Modal radio list, used by both the settings rows and the editor's dropdowns. */
export function OptionPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.backdrop}
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={[typography.label, styles.title, { color: theme.accent }]}>{title}</Text>
          <ScrollView>
            {options.map((option) => {
              const isSelected = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.label}
                  onPress={() => onSelect(option.value)}
                  style={styles.option}
                >
                  <Text
                    style={[
                      typography.body,
                      styles.optionLabel,
                      { color: isSelected ? theme.accent : theme.text },
                      option.fontFamily ? { fontFamily: option.fontFamily } : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? theme.accent : theme.textMuted}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    maxHeight: '70%',
  },
  title: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionLabel: { flex: 1 },
});
