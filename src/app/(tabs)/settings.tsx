import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { OptionPicker } from '../../ui/OptionPicker';
import { FONT_OPTIONS, fontFamilyFor } from '../../ui/fonts';
import { THEME_OPTIONS } from '../../ui/themes';
import { useThemeControls } from '../../ui/ThemeProvider';
import { radius, spacing, typography } from '../../ui/tokens';

function SectionHeader({ label }: { label: string }) {
  const { theme } = useThemeControls();
  return (
    <Text style={[typography.body, styles.section, { color: theme.accent }]}>{label}</Text>
  );
}

function LinkRow({
  label,
  icon,
  detail,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  detail?: string;
  onPress: () => void;
}) {
  const { theme } = useThemeControls();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <View style={styles.rowText}>
        <Text style={[typography.body, { color: theme.text }]}>{label}</Text>
        {detail ? (
          <Text style={[typography.caption, { color: theme.textMuted }]}>{detail}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ChoiceRow({
  label,
  icon,
  value,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  onPress: () => void;
}) {
  const { theme } = useThemeControls();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <View style={styles.rowText}>
        <Text style={[typography.body, { color: theme.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme, themeId, fontKey, setThemeId, setFontKey } = useThemeControls();
  const [picker, setPicker] = React.useState<'theme' | 'font' | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
      >
        <SectionHeader label="General" />

        <ChoiceRow
          label="Theme"
          icon="contrast-outline"
          value={THEME_OPTIONS.find((o) => o.id === themeId)?.label ?? 'System'}
          onPress={() => setPicker('theme')}
        />
        <ChoiceRow
          label="Font"
          icon="text-outline"
          value={FONT_OPTIONS.find((o) => o.key === fontKey)?.label ?? 'System'}
          onPress={() => setPicker('font')}
        />

        <SectionHeader label="About" />
        <LinkRow
          label="Build version"
          icon="information-circle-outline"
          detail={Constants.expoConfig?.version ?? '1.0.0'}
          onPress={() => {}}
        />
        <LinkRow
          label="Import events from calendar"
          icon="calendar-outline"
          onPress={() => {}}
        />
        <LinkRow
          label="All data stays on this device"
          icon="lock-closed-outline"
          onPress={() => {}}
        />
      </ScrollView>

      <OptionPicker
        visible={picker !== null}
        title={picker === 'font' ? 'Font' : 'Theme'}
        selected={picker === 'font' ? fontKey : themeId}
        options={
          picker === 'font'
            ? FONT_OPTIONS.map((o) => ({
                value: o.key,
                label: o.label,
                fontFamily: fontFamilyFor(o.key),
              }))
            : THEME_OPTIONS.map((o) => ({ value: o.id, label: o.label }))
        }
        onSelect={(next) => {
          if (picker === 'font') void setFontKey(next);
          else void setThemeId(next);
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xl * 2 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: { width: 26, alignItems: 'center' },
  rowText: { flex: 1, gap: 2 },
  detail: { borderRadius: radius.sm },
});
