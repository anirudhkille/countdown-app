import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import {
  createCountdown,
  deleteCountdown,
  getCountdown,
  updateCountdown,
} from '../../data/countdownRepo';
import {
  cancelForCountdown,
  scheduleForCountdown,
} from '../notifications/notificationService';
import type { CountdownDraft, Direction, Recurrence, Unit } from '../../domain/types';
import { Card } from '../../ui/Card';
import { Segmented } from '../../ui/Segmented';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { DateTimeField } from './DateTimeField';
import { OptionRow } from './OptionRow';

const REMINDER_OPTIONS: { value: string; label: string; hours: number | null }[] = [
  { value: 'none', label: 'Off', hours: null },
  { value: '1h', label: '1h', hours: 1 },
  { value: '1d', label: '1d', hours: 24 },
  { value: '1w', label: '1w', hours: 168 },
];

const SWATCHES: (string | null)[] = [
  null,
  '#6C5CE7',
  '#E8590C',
  '#2F9E68',
  '#D6336C',
  '#1C7ED6',
];

export function CountdownEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(() => new Date());
  const [showTime, setShowTime] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [direction, setDirection] = useState<Direction>('down');
  const [unit, setUnit] = useState<Unit>('auto');
  const [reminder, setReminder] = useState<string>('none');
  const [color, setColor] = useState<string | null>(null);
  const [emoji, setEmoji] = useState('');
  const [saving, setSaving] = useState(false);
  // Theme and font are now app-wide settings, so the editor has no controls for them.
  // These two still round-trip the stored values so an edit does not discard them.
  const [storedThemeId, setStoredThemeId] = useState<string>('system');
  const [storedFontFamily, setStoredFontFamily] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    void getCountdown(id).then((c) => {
      if (!c) return;
      setTitle(c.title);
      setTarget(new Date(c.targetDate));
      setShowTime(c.showTime);
      setRecurrence(c.recurrence);
      setDirection(c.direction);
      setUnit(c.unit);
      setColor(c.color);
      setStoredThemeId(c.themeId);
      setStoredFontFamily(c.fontFamily);
      setEmoji(c.emoji ?? '');
      if (c.remindAt === null) return;
      const hours = Math.round((c.remindAt - c.targetDate) / 3_600_000);
      const match = REMINDER_OPTIONS.find((o) => o.hours === -hours);
      setReminder(match?.value ?? 'none');
    });
  }, [id, isNew]);

  const reminderHours = useMemo(
    () => REMINDER_OPTIONS.find((o) => o.value === reminder)?.hours ?? null,
    [reminder]
  );

  async function save() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give this countdown a name.');
      return;
    }
    setSaving(true);
    const now = Date.now();
    const targetDate = target.getTime();

    const draft: CountdownDraft = {
      title: title.trim(),
      notes: null,
      targetDate,
      anchorDay: recurrence === 'none' ? null : target.getDate(),
      recurrence,
      direction,
      unit,
      showTime,
      themeId: storedThemeId,
      color,
      fontFamily: storedFontFamily,
      emoji: emoji.trim() || null,
      remindAt: reminderHours === null ? null : targetDate - reminderHours * 3_600_000,
    };

    try {
      if (isNew) {
        const created = await createCountdown(draft, Crypto.randomUUID(), now);
        await scheduleForCountdown(created);
      } else {
        await updateCountdown(id, draft, now);
        const updated = await getCountdown(id);
        await cancelForCountdown(id);
        if (updated) await scheduleForCountdown(updated);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete countdown?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelForCountdown(id);
          await deleteCountdown(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card theme={theme}>
        <View style={styles.gapSm}>
          <Text style={[typography.label, { color: theme.textMuted }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Anna's birthday"
            placeholderTextColor={theme.textMuted}
            style={[typography.title, { color: theme.text }]}
          />
          <TextInput
            value={emoji}
            onChangeText={setEmoji}
            placeholder="Emoji (optional)"
            placeholderTextColor={theme.textMuted}
            style={[typography.body, { color: theme.textMuted }]}
          />
        </View>
      </Card>

      <Card theme={theme}>
        <OptionRow theme={theme} label="Date">
          <DateTimeField
            theme={theme}
            value={target}
            showTime={showTime}
            onChange={setTarget}
          />
          <Segmented
            theme={theme}
            value={showTime ? 'time' : 'date'}
            onChange={(v) => setShowTime(v === 'time')}
            options={[
              { value: 'date', label: 'Date only' },
              { value: 'time', label: 'Include time' },
            ]}
          />
        </OptionRow>
      </Card>

      <Card theme={theme}>
        <OptionRow theme={theme} label="Repeats">
          <Segmented
            theme={theme}
            value={recurrence}
            onChange={setRecurrence}
            options={[
              { value: 'none', label: 'Never' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Direction" hint="Count up to track time since an event.">
          <Segmented
            theme={theme}
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'down', label: 'Counting down' },
              { value: 'up', label: 'Counting up' },
            ]}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Show in" hint="Auto picks the largest sensible unit.">
          <Segmented
            theme={theme}
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'days', label: 'Days' },
              { value: 'weeks', label: 'Weeks' },
              { value: 'months', label: 'Months' },
              { value: 'years', label: 'Years' },
            ]}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Remind me">
          <Segmented
            theme={theme}
            value={reminder}
            onChange={setReminder}
            options={REMINDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </OptionRow>
      </Card>

      <Card theme={theme}>
        <OptionRow
          theme={theme}
          label="Accent colour"
          hint="Overrides the theme accent for this countdown."
        >
          <View style={styles.swatches}>
            {SWATCHES.map((swatch) => (
              <Pressable
                key={swatch ?? 'inherit'}
                accessibilityRole="button"
                accessibilityLabel={swatch ?? 'Theme default'}
                onPress={() => setColor(swatch)}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: swatch ?? theme.surfaceAlt,
                    borderColor: color === swatch ? theme.accent : theme.border,
                    borderWidth: color === swatch ? 3 : 1,
                  },
                ]}
              />
            ))}
          </View>
        </OptionRow>
      </Card>

      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={() => void save()}
        style={[styles.primary, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
      >
        <Text style={[typography.title, { color: theme.accentText }]}>Save</Text>
      </Pressable>

      {!isNew ? (
        <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.delete}>
          <Text style={[typography.body, { color: '#E03131' }]}>Delete countdown</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  gapSm: { gap: spacing.sm },
  swatches: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  swatch: { width: 40, height: 40, borderRadius: radius.pill },
  primary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  delete: { paddingVertical: spacing.md, alignItems: 'center' },
});
