import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from './tokens';
import type { Theme } from './themes';

export function EmptyState({
  theme,
  title,
  message,
}: {
  theme: Theme;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={[typography.title, { color: theme.text }]}>{title}</Text>
      <Text style={[typography.body, { color: theme.textMuted, textAlign: 'center' }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});
