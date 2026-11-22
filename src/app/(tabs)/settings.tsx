import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  applyBackup,
  exportBackup,
  pickBackup,
  type RestoreMode,
} from '../../features/backup/backupService';
import { reconcileAll } from '../../features/notifications/notificationService';
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
  disabled,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { theme } = useThemeControls();
  const content = (
    <View style={[styles.rowInner, disabled ? styles.disabled : null]}>
      <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{label}</Text>
      {value ? (
        <Text numberOfLines={1} style={[typography.label, { color: theme.textMuted }]}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.textFaint} /> : null}
    </View>
  );

  if (!onPress || disabled) return content;

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

function chooseRestoreMode(): Promise<RestoreMode | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Restore backup',
      'Merge keeps the countdowns already on this device. Replace removes them first.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Merge', onPress: () => resolve('merge') },
        { text: 'Replace', style: 'destructive', onPress: () => resolve('replace') },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function SettingsScreen() {
  const { theme, themeId, fontKey, setThemeId, setFontKey } = useThemeControls();
  const router = useRouter();
  const [picker, setPicker] = React.useState<'theme' | 'font' | null>(null);
  const [busy, setBusy] = React.useState<'export' | 'restore' | null>(null);

  async function shareBackup() {
    if (busy) return;
    setBusy('export');
    try {
      const count = await exportBackup(Date.now());
      Alert.alert(
        'Backup ready',
        `${count} countdown${count === 1 ? '' : 's'} shared as a JSON file.`
      );
    } catch (error) {
      Alert.alert('Could not export backup', errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function restoreBackup() {
    if (busy) return;
    setBusy('restore');
    try {
      const parsed = await pickBackup();
      if (!parsed) return;
      const mode = await chooseRestoreMode();
      if (!mode) return;
      const { imported, skipped } = await applyBackup(parsed.countdowns, mode);
      await reconcileAll();
      const skippedText = skipped > 0 ? ` ${skipped} already existed.` : '';
      const malformedText = parsed.malformed > 0 ? ` ${parsed.malformed} entr${parsed.malformed === 1 ? 'y was' : 'ies were'} unreadable.` : '';
      Alert.alert(
        'Backup restored',
        `${imported} countdown${imported === 1 ? '' : 's'} imported.${skippedText}${malformedText}`
      );
    } catch (error) {
      Alert.alert('Could not restore backup', errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

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
          <Group>
            <Row
              label="Export backup"
              value={busy === 'export' ? 'Preparing…' : undefined}
              onPress={() => void shareBackup()}
              disabled={busy !== null}
            />
            <Row
              label="Restore backup"
              value={busy === 'restore' ? 'Restoring…' : undefined}
              onPress={() => void restoreBackup()}
              disabled={busy !== null}
            />
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
  disabled: { opacity: 0.5 },
  footnote: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.xs,
    lineHeight: 18,
  },
});
