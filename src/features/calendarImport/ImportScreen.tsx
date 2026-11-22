import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { calendarEventExists, createCountdown } from '../../data/countdownRepo';
import { scheduleForCountdown } from '../notifications/notificationService';
import { useNow } from '../countdowns/useNow';
import { EmptyState } from '../../ui/EmptyState';
import { StackHeader } from '../../ui/StackHeader';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import {
  hasCalendarPermission,
  isCalendarAvailable,
  listImportableEvents,
  type ImportableEvent,
} from './importEvents';

function DateBadge({ date }: { date: number }) {
  const theme = useTheme();
  const value = new Date(date);
  return (
    <View style={[styles.badge, { backgroundColor: theme.surfaceAlt }]}>
      <Text style={[styles.badgeDay, { color: theme.text }]}>{value.getDate()}</Text>
      <Text style={[typography.micro, { color: theme.textMuted }]}>
        {value.toLocaleDateString(undefined, { month: 'short' })}
      </Text>
    </View>
  );
}

export function ImportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const now = useNow();
  const [events, setEvents] = useState<ImportableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!isCalendarAvailable()) {
        if (!cancelled) {
          setUnavailable(true);
          setLoading(false);
        }
        return;
      }
      const granted = await hasCalendarPermission();
      if (cancelled) return;
      if (!granted) {
        if (!isCalendarAvailable()) {
          setUnavailable(true);
        } else {
          Alert.alert(
            'Calendar access needed',
            'Grant calendar access to pick events from your device.'
          );
        }
        setLoading(false);
        return;
      }
      const current = new Date();
      const start = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      const end = new Date(current.getFullYear() + 2, current.getMonth() + 1, 1);
      const found = await listImportableEvents(start, end);
      if (cancelled) return;
      setEvents(found);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function importEvent(event: ImportableEvent) {
    if (importingId) return;
    setImportingId(event.id);
    try {
      if (await calendarEventExists(event.id)) {
        Alert.alert('Already imported', 'This event is already one of your countdowns.');
        return;
      }
      const created = await createCountdown(
        {
          title: event.title,
          notes: event.notes,
          targetDate: event.date,
          anchorDay: null,
          recurrence: 'none',
          direction: 'down',
          unit: 'auto',
          showTime: !event.allDay,
          color: null,
          reminders: [],
          calendarEventId: event.id,
        },
        Crypto.randomUUID(),
        now
      );

      await scheduleForCountdown(created);
      router.back();
    } catch {
      Alert.alert('Could not import event', 'The event was not added. Try again.');
    } finally {
      setImportingId(null);
    }
  }

  if (unavailable) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <StackHeader title="Import" />
        <View style={styles.unavailable}>
          <View style={[styles.unavailableIcon, { backgroundColor: theme.surfaceAlt }]}>
            <Ionicons name="calendar-outline" size={30} color={theme.textMuted} />
          </View>
          <Text style={[typography.title, styles.unavailableTitle, { color: theme.text }]}>
            Calendar import needs a development build
          </Text>
          <Text style={[typography.body, styles.unavailableBody, { color: theme.textMuted }]}>
            Expo Go does not include calendar access. Install a development build with the command
            below, then try again.
          </Text>
          <View style={[styles.code, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.caption, { color: theme.text, fontFamily: 'monospace' }]}>
              expo run:android
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
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
      <StackHeader title="Import" />
      {loading ? (
        <View style={styles.loading}>
          <Text style={[typography.body, { color: theme.textMuted }]}>Reading your calendar…</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text style={[typography.body, { color: theme.textMuted }]}>
                Events from the next two years and the past month. Tap one to turn it into a
                countdown.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              theme={theme}
              title="No events found"
              message="Once your calendar has upcoming events, they will show up here."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Import ${item.title}`}
              disabled={importingId !== null}
              onPress={() => void importEvent(item)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: importingId !== null && importingId !== item.id ? 0.4 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <DateBadge date={item.date} />
              <View style={styles.rowText}>
                <Text numberOfLines={1} style={[typography.bodyStrong, { color: theme.text }]}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={[typography.caption, { color: theme.textMuted }]}>
                  {new Date(item.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {item.allDay ? ', all day' : ''}
                </Text>
              </View>
              {importingId === item.id ? (
                <ActivityIndicator size="small" color={theme.accentInk} />
              ) : (
                <Ionicons name="add-circle-outline" size={24} color={theme.accentInk} />
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { paddingBottom: spacing.sm, paddingHorizontal: spacing.xs },
  badge: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDay: { fontSize: 17, lineHeight: 20, fontWeight: '700' },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 2 },
  unavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  unavailableIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableTitle: { textAlign: 'center' },
  unavailableBody: { textAlign: 'center', maxWidth: 320 },
  code: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
});
