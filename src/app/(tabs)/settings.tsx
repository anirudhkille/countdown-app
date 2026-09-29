import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeGalleryScreen } from '../../features/themes/ThemeGalleryScreen';
import { Card } from '../../ui/Card';
import { spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={[typography.title, { color: theme.text }]}>Themes</Text>
      <ThemeGalleryScreen />

      <Card theme={theme}>
        <View style={styles.gap}>
          <Text style={[typography.label, { color: theme.textMuted }]}>About</Text>
          <Text style={[typography.body, { color: theme.text }]}>
            All countdowns are stored on this device. Nothing is uploaded and no account
            is required.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  gap: { gap: spacing.xs },
});
