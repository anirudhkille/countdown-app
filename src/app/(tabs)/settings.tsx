import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { OptionPicker } from '../../ui/OptionPicker';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { FONT_OPTIONS, fontFamilyFor } from '../../ui/fonts';
import { DARK, LIGHT, THEME_OPTIONS } from '../../ui/themes';
import { useThemeControls } from '../../ui/ThemeProvider';
import { control, radius, spacing, typography } from '../../ui/tokens';

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme } = useThemeControls();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeControls();
  const items = React.Children.toArray(children);
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 ? (
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const { theme } = useThemeControls();
  const content = (
    <View style={styles.rowInner}>
      <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{label}</Text>
      {value ? (
        <Text numberOfLines={1} style={[typography.label, { color: theme.textMuted }]}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.textFaint} /> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: pressed ? theme.surfaceAlt : 'transparent' })}
    >
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme, themeId, fontKey, setThemeId, setFontKey } = useThemeControls();
  const router = useRouter();
  const [picker, setPicker] = React.useState<'theme' | 'font' | null>(null);

  const themeValue = THEME_OPTIONS.find((option) => option.id === themeId)?.label ?? 'System';
  const activeFontKey = fontFamilyFor(fontKey) ?? 'System';
  const fontValue = FONT_OPTIONS.find((option) => option.key === activeFontKey)?.label ?? 'System';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" subtitle="Appearance and data" />

      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
      >
        <Section label="Appearance">
          <Group>
            <Row label="Theme" value={themeValue} onPress={() => setPicker('theme')} />
            <Row label="Countdown font" value={fontValue} onPress={() => setPicker('font')} />
          </Group>
        </Section>

        <Section label="Data">
          <Group>
            <Row label="Import from calendar" onPress={() => router.push('/import')} />
          </Group>
        </Section>

        <Section label="About">
          <Group>
            <Row label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
          </Group>
        </Section>

        <Text style={[typography.caption, styles.footnote, { color: theme.textMuted }]}>
          Your countdowns stay on this device. No account, no sync, no tracking.
        </Text>
      </ScrollView>

      <OptionPicker
        visible={picker !== null}
        title={picker === 'font' ? 'Countdown font' : 'Theme'}
        selected={picker === 'font' ? activeFontKey : themeId}
        options={
          picker === 'font'
            ? FONT_OPTIONS.map((option) => ({
                value: option.key,
                label: option.label,
                fontFamily: fontFamilyFor(option.key),
              }))
            : THEME_OPTIONS.map((option) => ({
                value: option.id,
                label: option.label,
                swatch: option.id === 'dark' ? DARK.background : option.id === 'light' ? LIGHT.surface : theme.surfaceAlt,
              }))
        }
        onSelect={(next) => {
          if (picker === 'font') void setFontKey(next);
          else void setThemeId(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: control.gutter, paddingBottom: spacing.xxl },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  sectionLabel: {
    ...typography.micro,
    marginLeft: spacing.xs,
  },
  group: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md },
  rowInner: {
    minHeight: control.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  footnote: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.xs,
    lineHeight: 18,
  },
});
