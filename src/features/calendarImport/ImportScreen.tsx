import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { createCountdown } from '../../data/countdownRepo';
import { scheduleForCountdown } from '../notifications/notificationService';
import { useNow } from '../countdowns/useNow';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import {
  hasCalendarPermission,
  listImportableEvents,
  type ImportableEvent,
} from './importEvents';

export function ImportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const now = useNow();
  const [events, setEvents] = useState<ImportableEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const granted = await hasCalendarPermission();
      if (cancelled) return;
      if (!granted) {
        Alert.alert(
          'Calendar access needed',
          'Grant calendar access to pick events from your device.'
        );
        setLoading(false);
        return;
      }
      const current = new Date(now);
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
  }, [now]);

  async function importEvent(event: ImportableEvent) {
    const date = new Date(event.date);
    const created = await createCountdown(
      {
        title: event.title,
        notes: event.notes,
        targetDate: event.date,
        anchorDay: date.getDate(),
        recurrence: event.allDay ? 'yearly' : 'none',
        direction: 'down',
        unit: 'auto',
        showTime: !event.allDay,
        themeId: theme.id,
        color: null,
        fontFamily: null,
        emoji: null,
        remindAt: null,
        calendarEventId: event.id,
      },
      Crypto.randomUUID(),
      now
    );

    await scheduleForCountdown(created);
    router.back();
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      {loading ? (
        <Text style={[typography.body, styles.loading, { color: theme.textMuted }]}>
          Reading your calendar…
        </Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Import ${item.title}`}
              onPress={() => void importEvent(item)}
              style={[
                styles.row,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.rowText}>
                <Text style={[typography.body, { color: theme.text }]}>{item.title}</Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  {new Date(item.date).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {item.allDay ? ' · all day' : ''}
                </Text>
              </View>
              <Text style={[typography.title, { color: theme.accent }]}>+</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { padding: spacing.lg },
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 2 },
});
