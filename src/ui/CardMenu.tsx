import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography } from './tokens';
import { useTheme } from './ThemeProvider';

export interface MenuAction {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  destructive?: boolean;
  onPress: () => void;
}

/** Bottom-anchored action sheet, the Android equivalent of an overflow menu. */
export function CardMenu({
  visible,
  title,
  actions,
  onClose,
}: {
  visible: boolean;
  title: string;
  actions: MenuAction[];
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close menu"
        style={styles.backdrop}
        onPress={onClose}
      >
        <View style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + spacing.md }]}>
          <Text numberOfLines={1} style={[typography.label, styles.title, { color: theme.textMuted }]}>
            {title}
          </Text>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              style={styles.action}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={action.destructive ? '#E03131' : theme.text}
              />
              <Text
                style={[
                  typography.body,
                  styles.actionLabel,
                  { color: action.destructive ? '#E03131' : theme.text },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingTop: spacing.sm },
  title: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionLabel: { flex: 1 },
});
