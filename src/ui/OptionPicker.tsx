import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography } from './tokens';
import { useTheme } from './ThemeProvider';

export interface PickerOption {
  value: string;
  label: string;
  fontFamily?: string;
  swatch?: string;
}

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
  const insets = useSafeAreaInsets();

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
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={[styles.grabber, { backgroundColor: theme.borderStrong }]} />
          <Text style={[typography.title, styles.title, { color: theme.text }]}>{title}</Text>
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
                  style={({ pressed }) => [
                    styles.option,
                    pressed ? { backgroundColor: theme.surfaceAlt } : null,
                  ]}
                >
                  {option.swatch ? (
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: option.swatch, borderColor: theme.borderStrong },
                      ]}
                    />
                  ) : null}
                  <Text
                    style={[
                      typography.body,
                      styles.optionLabel,
                      { color: theme.text },
                      option.fontFamily ? { fontFamily: option.fontFamily, fontSize: 18 } : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={22} color={theme.accentInk} />
                  ) : null}
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    maxHeight: '78%',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 52,
  },
  optionLabel: { flex: 1 },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
