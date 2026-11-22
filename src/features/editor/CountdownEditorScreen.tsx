import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { FormGroup, FormInput, FormRow, FormSwitch } from '../../ui/FieldRow';
import { OptionPicker } from '../../ui/OptionPicker';
import { StackHeader } from '../../ui/StackHeader';
import { control, radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { formatPreciseRemaining } from '../../domain/format';
import { remainingFraction } from '../../domain/progress';
import { resolveOccurrence } from '../../domain/recurrence';
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

const SWATCHES: (string | null)[] = [
  null,
  '#D9B44A',
  '#D9694A',
  '#5B8C7B',
  '#5A7DB5',
  '#B06A9A',
  '#8C9299',
];

type Picker = 'recurrence' | 'unit' | 'direction' | 'reminder';

export function CountdownEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>(
    isNew ? 'ready' : 'loading'
  );
  const [picker, setPicker] = useState<Picker | null>(null);
  const [createdAt, setCreatedAt] = useState(0);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    void getCountdown(id)
      .then((c) => {
        if (cancelled) return;
        if (!c) {
          setStatus('missing');
          return;
        }
        setTitle(c.title);
        setTarget(new Date(c.targetDate));
        setShowTime(c.showTime);
        setRecurrence(c.recurrence);
        setDirection(c.direction);
        setUnit(c.unit);
        setColor(c.color);
        setNotes(c.notes ?? '');
        setCreatedAt(c.createdAt);
        if (c.remindAt !== null) {
          const hours = Math.round((c.remindAt - c.targetDate) / 3_600_000);
          setReminder(REMINDER_OPTIONS.find((o) => o.hours === -hours)?.value ?? 'none');
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const reminderHours = useMemo(
    () => REMINDER_OPTIONS.find((o) => o.value === reminder)?.hours ?? null,
    [reminder]
  );

  const anchorDay = recurrence === 'none' ? null : target.getDate();
  const occurrence = useMemo(
    () => resolveOccurrence(target.getTime(), recurrence, now, anchorDay),
    [target, recurrence, now, anchorDay]
  );

  const preview = useMemo(
    () =>
      calculateCountdown({
        occurrence,
        now,
        direction,
        unit,
        anchorDay,
      }),
    [occurrence, now, direction, unit, anchorDay]
  );

  const remaining = remainingFraction(
    { createdAt: createdAt || now, recurrence, anchorDay, direction },
    occurrence,
    now
  );
  const precise =
    direction === 'down' ? formatPreciseRemaining(occurrence, now) : null;

  async function save() {
    if (saving || status !== 'ready') return;
    setSaving(true);
    setSaveError(null);
    const savedAt = Date.now();
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
      color,
      remindAt: reminderHours === null ? null : targetDate - reminderHours * 3_600_000,
    };

    try {
      if (isNew) {
        const created = await createCountdown(draft, Crypto.randomUUID(), savedAt);
        await scheduleForCountdown(created);
      } else {
        await updateCountdown(id, draft, savedAt);
        const updated = await getCountdown(id);
        await cancelForCountdown(id);
        if (updated) await scheduleForCountdown(updated);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setSaveError('Your countdown could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const dateText = target.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeText = target.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const pickerTitle =
    picker === 'recurrence'
      ? 'Repeats'
      : picker === 'unit'
        ? 'Count in'
        : picker === 'direction'
          ? 'Direction'
          : 'Reminder';

  if (status === 'loading') {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <StackHeader title="Countdown" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </View>
    );
  }

  if (status === 'missing') {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <StackHeader title="Countdown" />
        <View style={styles.center}>
          <Text style={[typography.title, styles.missingTitle, { color: theme.text }]}>
            Countdown not found
          </Text>
          <Text style={[typography.body, styles.missingBody, { color: theme.textMuted }]}>
            It may have been deleted on this device.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [
              styles.missingButton,
              { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[typography.body, { color: theme.text }]}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <StackHeader title={isNew ? 'New countdown' : 'Edit countdown'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stage}>
          <Text
            numberOfLines={2}
            style={[typography.title, styles.stageTitle, { color: title.trim() ? theme.text : theme.textMuted }]}
          >
            {title.trim() || 'Untitled countdown'}
          </Text>
          <ProgressRing
            value={preview}
            direction={direction}
            size={176}
            stroke={9}
            color={color}
            remaining={remaining}
            precise={precise}
          />
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {dateText}
            {showTime ? ` at ${timeText}` : ''}
          </Text>
        </View>

        <FormGroup title="Event">
          <FormInput
            label="Name"
            value={title}
            onChangeText={setTitle}
            placeholder="Trip to Lisbon"
          />
          <DateTimeField
            value={target}
            showTime={showTime}
            onChange={setTarget}
          />
          <FormSwitch label="Include a time" value={showTime} onChange={setShowTime} />
        </FormGroup>

        <FormGroup title="Schedule">
          <FormRow
            label="Repeats"
            value={RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label}
            onPress={() => setPicker('recurrence')}
          />
          <FormRow
            label="Count in"
            value={UNIT_OPTIONS.find((o) => o.value === unit)?.label}
            onPress={() => setPicker('unit')}
          />
          <FormRow
            label="Direction"
            value={DIRECTION_OPTIONS.find((o) => o.value === direction)?.label}
            onPress={() => setPicker('direction')}
          />
          <FormRow
            label="Reminder"
            value={REMINDER_OPTIONS.find((o) => o.value === reminder)?.label}
            onPress={() => setPicker('reminder')}
          />
        </FormGroup>

        <FormGroup title="Color">
          <View style={styles.swatchRow}>
            {SWATCHES.map((swatch) => {
              const selected = color === swatch;
              return (
                <Pressable
                  key={swatch ?? 'default'}
                  accessibilityRole="button"
                  accessibilityLabel={swatch ?? 'Default color'}
                  accessibilityState={{ selected }}
                  onPress={() => setColor(swatch)}
                  style={[
                    styles.swatchOuter,
                    { borderColor: selected ? theme.accentInk : 'transparent' },
                  ]}
                >
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: swatch ?? theme.surfaceAlt,
                        borderColor: swatch ? 'transparent' : theme.borderStrong,
                      },
                    ]}
                  >
                    {swatch === null ? (
                      <View style={[styles.defaultDot, { backgroundColor: theme.accent }]} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </FormGroup>

        <FormGroup title="Notes">
          <FormInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything you want to remember"
            multiline
          />
        </FormGroup>

        {saveError ? (
          <Text style={[typography.caption, styles.saveError, { color: theme.danger }]}>
            {saveError}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isNew ? 'Save countdown' : 'Save changes'}
          disabled={saving}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.save,
            {
              backgroundColor: theme.accent,
              opacity: saving ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[typography.bodyStrong, styles.saveLabel, { color: theme.accentText }]}>
            {saving ? 'Saving…' : isNew ? 'Save countdown' : 'Save changes'}
          </Text>
        </Pressable>
      </ScrollView>

      <OptionPicker
        visible={picker !== null}
        title={pickerTitle}
        options={(
          picker === 'recurrence'
            ? RECURRENCE_OPTIONS
            : picker === 'unit'
              ? UNIT_OPTIONS
              : picker === 'direction'
                ? DIRECTION_OPTIONS
                : REMINDER_OPTIONS
        ) as { value: string; label: string }[]}
        selected={
          picker === 'recurrence'
            ? recurrence
            : picker === 'unit'
              ? unit
              : picker === 'direction'
                ? direction
                : reminder
        }
        onSelect={(next) => {
          if (picker === 'recurrence') setRecurrence(next as Recurrence);
          if (picker === 'unit') setUnit(next as Unit);
          if (picker === 'direction') setDirection(next as Direction);
          if (picker === 'reminder') setReminder(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  missingTitle: { textAlign: 'center' },
  missingBody: { textAlign: 'center', maxWidth: 300 },
  missingButton: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  container: { flex: 1 },
  content: {
    paddingHorizontal: control.gutter,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  stage: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  stageTitle: { textAlign: 'center', paddingHorizontal: spacing.md },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  swatchOuter: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultDot: { width: 10, height: 10, borderRadius: 5 },
  saveError: { textAlign: 'center', marginTop: -spacing.sm },
  save: {
    borderRadius: radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontSize: 16 },
});
