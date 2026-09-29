import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeControls } from '../../ui/ThemeProvider';
import { THEMES } from '../../ui/themes';
import { radius, spacing, typography } from '../../ui/tokens';

export function ThemeGalleryScreen() {
  const { theme, setThemeId } = useThemeControls();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {THEMES.map((candidate) => {
        const active = candidate.id === theme.id;
        return (
          <Pressable
            key={candidate.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => void setThemeId(candidate.id)}
            style={[
              styles.tile,
              {
                borderColor: active ? candidate.accent : candidate.border,
                borderWidth: active ? 2 : 1,
              },
            ]}
          >
            <View style={[styles.preview, { backgroundColor: candidate.background }]}>
              <View style={[styles.card, { backgroundColor: candidate.surface }]}>
                <Text style={[typography.label, { color: candidate.textMuted }]}>
                  Birthday
                </Text>
                <Text
                  style={[typography.hero, styles.previewHero, { color: candidate.accent }]}
                >
                  128
                </Text>
                <Text style={[typography.caption, { color: candidate.textMuted }]}>
                  days left
                </Text>
              </View>
            </View>
            <Text style={[typography.body, { color: candidate.text }]}>{candidate.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  tile: { borderRadius: radius.lg, padding: spacing.sm, gap: spacing.sm },
  preview: { borderRadius: radius.md, padding: spacing.md },
  card: { borderRadius: radius.md, padding: spacing.md },
  previewHero: { fontSize: 32 },
});
