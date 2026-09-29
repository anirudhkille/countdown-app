import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useCountdowns } from '../../features/countdowns/useCountdowns';
import { useNow } from '../../features/countdowns/useNow';
import { CountdownCard } from '../../features/countdowns/CountdownCard';
import { EmptyState } from '../../ui/EmptyState';
import { getViewMode, setViewMode, type ViewMode } from '../../data/settings';
import { radius, spacing } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

export default function CountdownsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { countdowns, loading, reload } = useCountdowns();
  const now = useNow();
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');

  useEffect(() => {
    void getViewMode().then(setViewModeState);
  }, []);

  const changeView = useCallback(async (next: ViewMode) => {
    setViewModeState(next);
    await setViewMode(next);
  }, []);

  const sorted = useMemo(() => {
    return [...countdowns].sort((a, b) => {
      const valueOf = (c: Countdown) => {
        const occurrence = resolveOccurrence(c.targetDate, c.recurrence, now, c.anchorDay);
        return calculateCountdown({
          occurrence,
          now,
          direction: c.direction,
          unit: 'days',
          anchorDay: c.anchorDay,
        }).totalDays;
      };
      return valueOf(a) - valueOf(b);
    });
  }, [countdowns, now]);

  // Actions live in the native header rather than a custom header row: the native
  // header already handles the status-bar inset, so a hand-rolled header had to add
  // `insets.top` itself, which double-offset the title and pushed the buttons toward
  // the right edge where they clipped on narrow screens.
  const headerActions = () => (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={viewMode === 'grid' ? 'Show as list' : 'Show as grid'}
        hitSlop={8}
        onPress={() => void changeView(viewMode === 'grid' ? 'list' : 'grid')}
        style={styles.headerButton}
      >
        <Ionicons
          name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
          size={22}
          color={theme.text}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Import from calendar"
        hitSlop={8}
        onPress={() => router.push('/import')}
        style={styles.headerButton}
      >
        <Ionicons name="download-outline" size={22} color={theme.text} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add countdown"
        hitSlop={8}
        onPress={() => router.push('/countdown/new')}
        style={[styles.headerButton, styles.addButton, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="add" size={24} color={theme.accentText} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Tabs.Screen options={{ title: 'Countdowns', headerRight: headerActions }} />

      <FlatList
        data={sorted}
        key={viewMode}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        onRefresh={() => void reload()}
        refreshing={loading}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              theme={theme}
              title="No countdowns yet"
              message="Tap + to add a birthday, a holiday, or anything you're looking forward to."
            />
          )
        }
        renderItem={({ item }) => (
          <CountdownCard
            countdown={item}
            now={now}
            style={viewMode === 'grid' ? styles.gridItem : undefined}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/countdown/${item.id}`);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: { marginLeft: spacing.xs },
  // Multi-column rows only divide evenly when each child flexes; without this the
  // cards size to their content and leave a ragged gap at the right edge.
  gridItem: { flex: 1 },
  // Column gap lives on the row wrapper and row gap on the content container, so the
  // two do not stack and double the spacing between cards.
  gridRow: { columnGap: spacing.md },
  list: {
    flexGrow: 1,
    padding: spacing.md,
    rowGap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
});
