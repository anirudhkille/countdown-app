import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radius, spacing, typography } from './tokens';
import type { Theme } from './themes';

export function EmptyState({
  theme,
  title,
  message,
  actionLabel,
  onAction,
}: {
  theme: Theme;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.dial, { borderColor: theme.border }]}>
        <Ionicons name="time-outline" size={38} color={theme.textMuted} />
      </View>
      <Text style={[typography.title, styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[typography.body, styles.message, { color: theme.textMuted }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[typography.bodyStrong, { color: theme.accentText }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dial: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 300 },
  action: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
});
