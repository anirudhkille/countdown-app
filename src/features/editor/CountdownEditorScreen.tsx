import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import {
  createCountdown,
  getCountdown,
  updateCountdown,
} from '../../data/countdownRepo';
import {
  cancelForCountdown,
  scheduleForCountdown,
} from '../notifications/notificationService';
import type { CountdownDraft, Direction, Recurrence, Unit } from '../../domain/types';
import { ProgressRing } from '../../ui/ProgressRing';
import { FieldRow, TextField, ToggleRow } from '../../ui/FieldRow';
import { OptionPicker } from '../../ui/OptionPicker';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { useNow } from '../countdowns/useNow';
import { DateTimeField } from './DateTimeField';

const REMINDER_OPTIONS: { value: string; label: string; hours: number | null }[] = [
  { value: 'none', label: 'Off', hours: null },
  { value: '1h', label: '1 hour before', hours: 1 },
  { value: '1d', label: '1 day before', hours: 24 },
  { value: '1w', label: '1 week before', hours: 168 },
];

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
];

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: 'down', label: 'Counting down' },
  { value: 'up', label: 'Counting up' },
];

const SWATCHES: (string | null)[] = [null, '#8A8A8A', '#FFFFFF', '#0D9DBB', '#E8590C', '#D6336C'];

export function CountdownEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const now = useNow();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(() => new Date());
  const [showTime, setShowTime] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [direction, setDirection] = useState<Direction>('down');
  const [unit, setUnit] = useState<Unit>('auto');
  const [reminder, setReminder] = useState<string>('none');
  const [color, setColor] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<null | 'recurrence' | 'unit' | 'direction' | 'reminder'>(null);
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
      setNotes(c.notes ?? '');
      setStoredThemeId(c.themeId);
      setStoredFontFamily(c.fontFamily);
      if (c.remindAt === null) return;
      const hours = Math.round((c.remindAt - c.targetDate) / 3_600_000);
      setReminder(REMINDER_OPTIONS.find((o) => o.hours === -hours)?.value ?? 'none');
    });
  }, [id, isNew]);

  const reminderHours = useMemo(
    () => REMINDER_OPTIONS.find((o) => o.value === reminder)?.hours ?? null,
    [reminder]
  );

  const preview = useMemo(
    () =>
      calculateCountdown({
        occurrence: target.getTime(),
        now,
        direction,
        unit,
      }),
    [target, now, direction, unit]
  );

  async function save() {
    setSaving(true);
    const now = Date.now();
    const targetDate = target.getTime();

    const draft: CountdownDraft = {
      title: title.trim(),
      notes: notes.trim() || null,
      targetDate,
      anchorDay: recurrence === 'none' ? null : target.getDate(),
      recurrence,
      direction,
      unit,
      showTime,
      themeId: storedThemeId,
      color,
      fontFamily: storedFontFamily,
      emoji: null,
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

  const openPicker = (which: 'recurrence' | 'unit' | 'direction' | 'reminder') =>
    setPicker(which);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
          <ProgressRing value={preview} direction={direction} size={140} stroke={11} />
          <Text style={[typography.caption, { color: theme.textMuted }]}>Preview</Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label="What is on that day?"
            icon="pricetag-outline"
            value={title}
            onChangeText={setTitle}
            placeholder="What is on that day?"
          />
          <DateTimeField
            theme={theme}
            value={target}
            showTime={showTime}
            onChange={setTarget}
            label="Select a date"
          />
          <ToggleRow
            label="Include time"
            icon="time-outline"
            value={showTime}
            onChange={setShowTime}
          />
          <FieldRow
            label="Recurrence"
            icon="repeat-outline"
            value={RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label ?? ''}
            onPress={() => openPicker('recurrence')}
          />
          <View style={styles.spacer} />
          <FieldRow
            label="Count for"
            icon="options-outline"
            value={UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? ''}
            onPress={() => openPicker('unit')}
          />
          <View style={styles.spacer} />
          <FieldRow
            label="Direction"
            icon="swap-vertical-outline"
            value={DIRECTION_OPTIONS.find((o) => o.value === direction)?.label ?? ''}
            onPress={() => openPicker('direction')}
          />
          <View style={styles.spacer} />
          <FieldRow
            label="Remind me"
            icon="notifications-outline"
            value={REMINDER_OPTIONS.find((o) => o.value === reminder)?.label ?? ''}
            onPress={() => openPicker('reminder')}
          />
          <View style={styles.spacer} />
          <TextField
            label="Your notes"
            icon="list-outline"
            value={notes}
            onChangeText={setNotes}
            placeholder="Your notes"
            multiline
          />
        </View>

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

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void save()}
          style={[styles.primary, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={[typography.body, styles.primaryLabel, { color: theme.accentText }]}>
            SAVE
          </Text>
        </Pressable>
      </ScrollView>

      <OptionPicker
        visible={picker !== null}
        title={
          picker === 'recurrence'
            ? 'Recurrence'
            : picker === 'unit'
              ? 'Count for'
              : picker === 'direction'
                ? 'Direction'
                : 'Remind me'
        }
        options={(
          picker === 'recurrence'
            ? RECURRENCE_OPTIONS
            : picker === 'unit'
              ? UNIT_OPTIONS
              : picker === 'direction'
                ? DIRECTION_OPTIONS
                : REMINDER_OPTIONS
        ) as { value: string; label: string }[]}
        selected={picker === 'recurrence' ? recurrence : picker === 'unit' ? unit : picker === 'direction' ? direction : reminder}
        onSelect={(next) => {
          if (picker === 'recurrence') setRecurrence(next as Recurrence);
          if (picker === 'unit') setUnit(next as Unit);
          if (picker === 'direction') setDirection(next as Direction);
          if (picker === 'reminder') setReminder(next);
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  previewCard: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  fields: { gap: spacing.md },
  spacer: { height: spacing.xs },
  iconSlot: { width: 28, alignItems: 'center' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  notesInput: {
    flex: 1,
    minHeight: 88,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  emojiInput: { paddingVertical: spacing.sm },
  swatches: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  swatch: { width: 48, height: 48, borderRadius: radius.pill },
  primary: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
  primaryLabel: { fontWeight: '700', letterSpacing: 1 },
  delete: { paddingVertical: spacing.md, alignItems: 'center' },
});
