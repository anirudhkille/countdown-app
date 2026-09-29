import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../ui/tokens';
import type { Theme } from '../../ui/themes';

export function OptionRow({
  theme,
  label,
  hint,
  children,
}: {
  theme: Theme;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={[typography.label, { color: theme.textMuted }]}>{label}</Text>
      {children}
      {hint ? (
        <Text style={[typography.caption, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
});
